const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { after, before, test } = require("node:test");
const { createApp } = require("../server");

let server;
let baseUrl;
let uploadDirectory;
const certificates = [];
const database = {
  async query(sql, values) {
    if (sql.includes("INSERT INTO certificates")) {
      const certificate = {
        id: certificates.length + 1,
        student_name: values[0],
        certificate_name: values[1],
        file_name: values[2],
        status: values[3],
        uploaded_at: new Date().toISOString(),
      };
      certificates.unshift(certificate);
      return { rows: [certificate] };
    }
    if (sql.includes("FROM certificates")) return { rows: certificates };
    throw new Error("Unexpected query in certificate API test");
  },
};

before(async () => {
  uploadDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "certificate-api-test-"));
  server = createApp(database, uploadDirectory).listen(0, "127.0.0.1");
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server?.listening) {
    await new Promise((resolve) => {
      server.close(resolve);
      server.closeAllConnections();
    });
  }
  if (uploadDirectory) fs.rmSync(uploadDirectory, { recursive: true, force: true });
});

test("serves certificate routes and validates private uploads", async () => {
  const home = await fetch(`${baseUrl}/`);
  assert.equal(home.status, 200);
  assert.match((await home.json()).message, /Backend is running/);

  const testRoute = await fetch(`${baseUrl}/test`);
  assert.equal(await testRoute.text(), "TEST ROUTE WORKING");

  const initialList = await fetch(`${baseUrl}/api/certificates`);
  assert.deepEqual(await initialList.json(), []);

  const form = new FormData();
  form.set("student_name", "Test Student");
  form.set("certificate_name", "Test Certificate");
  form.set("certificate", new Blob(["%PDF-1.4\nmock test document"], { type: "application/pdf" }), "test.pdf");
  const upload = await fetch(`${baseUrl}/api/certificates`, { method: "POST", body: form });
  const certificate = await upload.json();

  assert.equal(upload.status, 201);
  assert.equal(certificate.status, "Pending Review");
  assert.equal(certificate.student_name, "Test Student");
  assert.equal(fs.readdirSync(uploadDirectory).length, 1);
  assert.equal((await fetch(`${baseUrl}/${certificate.file_name}`)).status, 404);

  const invalidForm = new FormData();
  invalidForm.set("student_name", "Test Student");
  invalidForm.set("certificate_name", "Invalid Test");
  invalidForm.set("certificate", new Blob(["not a PDF"], { type: "application/pdf" }), "fake.pdf");
  const rejected = await fetch(`${baseUrl}/api/certificates`, { method: "POST", body: invalidForm });

  assert.equal(rejected.status, 400);
  assert.equal(certificates.length, 1);
  assert.equal(fs.readdirSync(uploadDirectory).length, 1);

  const oversizedForm = new FormData();
  oversizedForm.set("student_name", "Test Student");
  oversizedForm.set("certificate_name", "Oversized Test");
  oversizedForm.set(
    "certificate",
    new Blob([Buffer.alloc(5 * 1024 * 1024 + 1)], { type: "application/pdf" }),
    "large.pdf",
  );
  const oversized = await fetch(`${baseUrl}/api/certificates`, { method: "POST", body: oversizedForm });

  assert.equal(oversized.status, 413);
  assert.equal(certificates.length, 1);
  assert.equal(fs.readdirSync(uploadDirectory).length, 1);
});

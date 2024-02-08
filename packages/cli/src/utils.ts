import { Storage } from '@google-cloud/storage';

/** Upload the given file to GCS. Returns the GCS URL of the uploaded file. */
export async function UploadToGCS(bucketName: string, fileName: string, fileContents: string): Promise<string> {
  const storage = new Storage();
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(fileName);
  console.log(`Uploading ${fileName} to ${bucketName}`);
  await file.save(fileContents);
  // Note that signed URLs are only good for up to 7 days, but we want these links to be permanent,
  // so we should store things in a publicly readable bucket.
  return `https://storage.googleapis.com/${bucketName}/${fileName}`;
}

import { useState } from "react";
import { ObjectUploader } from "./ObjectUploader";

export default function VideoUploadTest() {
  const [lastUpload, setLastUpload] = useState(null);

  return (
    <div className="p-8 max-w-md mx-auto bg-white rounded-xl shadow-md space-y-4 border border-blue-200 mt-10">
      <h1 className="text-2xl font-bold text-blue-600">Jolt Video Lab</h1>
      <p className="text-gray-600 ELI5">
        This is where we test uploading instructional videos for the Jolt Automated Barista.
      </p>
      
      <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50">
        <ObjectUploader
          maxFileSize={50 * 1024 * 1024} // 50MB for videos
          onGetUploadParameters={async (file) => {
            const res = await fetch("/api/uploads/request-url", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: file.name,
                size: file.size,
                contentType: file.type,
              }),
            });
            const { uploadURL } = await res.json();
            return {
              method: "PUT",
              url: uploadURL,
              headers: { "Content-Type": file.type },
            };
          }}
          onComplete={(result) => {
            console.log("Upload complete:", result);
            if (result.successful && result.successful.length > 0) {
              setLastUpload(result.successful[0]);
            }
          }}
          buttonClassName="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full shadow-lg transform transition active:scale-95"
        >
          Select Video to Upload
        </ObjectUploader>
      </div>

      {lastUpload && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-700 font-medium">Success!</p>
          <p className="text-sm text-green-600 truncate">File: {lastUpload.name}</p>
          <p className="text-xs text-gray-500 mt-2">
            You can find this in the object storage now.
          </p>
        </div>
      )}
    </div>
  );
}

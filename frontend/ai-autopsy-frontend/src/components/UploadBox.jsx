export default function UploadBox({ onUpload }) {
  return (
    <div style={{
      border: "2px dashed #555",
      padding: "40px",
      textAlign: "center",
      borderRadius: "12px",
      background: "#111",
      color: "#eee"
    }}>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => onUpload(e.target.files[0])}
      />
      <p style={{ marginTop: "10px", opacity: 0.7 }}>
        Upload an image for AI forensic analysis
      </p>
    </div>
  );
}

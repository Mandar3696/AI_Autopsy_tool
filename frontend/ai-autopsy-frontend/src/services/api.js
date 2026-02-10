export async function predictImage(file) {
  const formData = new FormData()
  formData.append("file", file)

  const response = await fetch("http://127.0.0.1:8000/predict", {
    method: "POST",
    body: formData
  })

  if (!response.ok) {
    throw new Error("Prediction failed")
  }

  return response.json()
}

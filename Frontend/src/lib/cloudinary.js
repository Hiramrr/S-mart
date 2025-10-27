export async function subirImagenCloudinary(archivo) {
  const formData = new FormData()
  formData.append('file', archivo)
  formData.append('upload_preset', 'productos')
  formData.append('folder', 'productos')

  const res = await fetch('https://api.cloudinary.com/v1_1/dmklwlv34/image/upload', {
    method: 'POST',
    body: formData,
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error?.message || 'Error al subir imagen')
  }

  return data.secure_url
}

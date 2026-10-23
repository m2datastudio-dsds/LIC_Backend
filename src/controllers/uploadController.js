export const uploadProductImage = (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'Please select an image file.' });
  const imageUrl = `${req.protocol}://${req.get('host')}/uploads/products/${req.file.filename}`;
  return res.status(201).json({ success: true, message: 'Image uploaded successfully', data: { imageUrl } });
};

export const uploadPropertyMedia = (req, res) => {
  if (!req.files?.length) return res.status(400).json({ success: false, message: 'Please select photo or video files.' });
  const media = req.files.map((file) => ({
    url: `${req.protocol}://${req.get('host')}/uploads/properties/${file.filename}`,
    type: file.mimetype.startsWith('video/') ? 'video' : 'image',
  }));
  return res.status(201).json({ success: true, message: 'Media uploaded successfully', data: media });
};

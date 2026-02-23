-- Storage policies for xrays bucket
CREATE POLICY "Authenticated users can upload xrays"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'xrays');

CREATE POLICY "Users can view own xrays"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'xrays' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own xrays"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'xrays' AND (storage.foldername(name))[1] = auth.uid()::text);

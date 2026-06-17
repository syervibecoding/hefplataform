
CREATE POLICY "internal team read platform-files"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'platform-files' AND (
      public.has_role(auth.uid(), 'admin') OR
      public.has_role(auth.uid(), 'coordenador') OR
      public.has_role(auth.uid(), 'user')
    )
  );

CREATE POLICY "internal team insert platform-files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'platform-files' AND (
      public.has_role(auth.uid(), 'admin') OR
      public.has_role(auth.uid(), 'coordenador') OR
      public.has_role(auth.uid(), 'user')
    )
  );

CREATE POLICY "internal team update platform-files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'platform-files' AND (
      public.has_role(auth.uid(), 'admin') OR
      public.has_role(auth.uid(), 'coordenador') OR
      public.has_role(auth.uid(), 'user')
    )
  );

CREATE POLICY "internal team delete platform-files"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'platform-files' AND (
      public.has_role(auth.uid(), 'admin') OR
      public.has_role(auth.uid(), 'coordenador') OR
      public.has_role(auth.uid(), 'user')
    )
  );

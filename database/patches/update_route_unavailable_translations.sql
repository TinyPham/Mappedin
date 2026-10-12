-- One passenger-facing message for route failures. Safe to rerun.
SET NOCOUNT ON;
MERGE dbo.Translation_UI WITH (HOLDLOCK) AS target
USING (
  SELECT keys.KeyCode, 'label' AS KeyType, message.VN, message.EN, message.ZH, message.JA, message.KO
  FROM (VALUES ('not_found'), ('error_nav'), ('airport_policy_error')) AS keys(KeyCode)
  CROSS JOIN (VALUES (
    N'Không tìm thấy đường đi phù hợp. Vui lòng liên hệ quầy thông tin để biết thêm thông tin chi tiết.',
    N'No suitable route was found. Please contact the information desk for further details.',
    N'未找到合适的路线。请联系问讯处了解更多详细信息。',
    N'適切な経路が見つかりませんでした。詳しくは案内カウンターにお問い合わせください。',
    N'적절한 경로를 찾을 수 없습니다. 자세한 내용은 안내 데스크에 문의해 주세요.'
  )) AS message(VN, EN, ZH, JA, KO)
) AS source
ON target.KeyCode = source.KeyCode
WHEN MATCHED THEN
  UPDATE SET VN = source.VN, EN = source.EN, ZH = source.ZH, JA = source.JA, KO = source.KO
WHEN NOT MATCHED BY TARGET THEN
  INSERT (KeyCode, KeyType, VN, EN, ZH, JA, KO)
  VALUES (source.KeyCode, source.KeyType, source.VN, source.EN, source.ZH, source.JA, source.KO);

SELECT KeyCode, VN, EN, ZH, JA, KO FROM dbo.Translation_UI
WHERE KeyCode IN ('not_found', 'error_nav', 'airport_policy_error') ORDER BY KeyCode;

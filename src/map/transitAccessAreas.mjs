// Real Mappedin areas on the simplified Public-Transit layouts, independent of language.
export const transitAccessAreas = [
  { mappedinId: 's_caf7bbbd1bd3d52b', floorId: 'm_e448414eab3177cc', icon: '/icon-category/airside.png' },
  { mappedinId: 's_34851831bce291e0', floorId: 'm_e448414eab3177cc', icon: '/icon-category/airside.png' },
  { mappedinId: 's_36edda6c5c8ca79f', floorId: 'm_e448414eab3177cc', icon: '/icon-category/landside.png' },
  { mappedinId: 's_e5c165df54a55000', floorId: 'm_8594d50bd499193b', icon: '/icon-category/airside.png' },
  { mappedinId: 's_e2d7dad50e2e6747', floorId: 'm_8594d50bd499193b', icon: '/icon-category/landside.png' },
  { mappedinId: 's_a064cebd857e2376', floorId: 'm_0edd812b8b0f6b85', icon: '/icon-category/airside.png' },
  { mappedinId: 's_f729abd4f5857e8d', floorId: 'm_ac310838cf2c457c', icon: '/icon-category/airside.png' },
  { mappedinId: 's_18cb590899ba4338', floorId: 'm_ac310838cf2c457c', icon: '/icon-category/landside.png' }
];

export const transitAccessAreaById = new Map(transitAccessAreas.map(area => [area.mappedinId, area]));

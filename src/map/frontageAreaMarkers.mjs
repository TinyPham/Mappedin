// Presentation settings for the three real Floor 3 frontage POIs.
export const frontageAreaMarkers = [
  {mappedinId:'s_b3c516ed46579e74',floorId:'m_1523f7dcde647c40',icon:'/icon-category/AirportService/taxi-pickup-area.png'},
  {mappedinId:'s_0bbbee1af4e9e795',floorId:'m_1523f7dcde647c40',icon:'/icon-category/Connection/entrance.png'},
  {mappedinId:'s_561efa29d1fefb0c',floorId:'m_1523f7dcde647c40',icon:'/icon-category/AirportService/parking.png',
    anchor:{latitude:10.772253420769129,longitude:107.04054476732475}}
];
export const frontageAreaById = new Map(frontageAreaMarkers.map(area=>[area.mappedinId,area]));

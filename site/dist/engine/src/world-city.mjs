const rows=[
 ['tokyo','東京','Tokyo',35.6762,139.6503,'Asia/Tokyo'],
 ['diet','国会議事堂','National Diet',35.676,139.745,'Asia/Tokyo'],
 // Prefectural capital presets use representative coordinates. The existing Tokyo preset is preserved.
 ['sapporo','札幌','Sapporo',43.0642,141.3469,'Asia/Tokyo'],
 ['aomori','青森','Aomori',40.8244,140.7400,'Asia/Tokyo'],
 ['morioka','盛岡','Morioka',39.7036,141.1527,'Asia/Tokyo'],
 ['sendai','仙台','Sendai',38.2688,140.8721,'Asia/Tokyo'],
 ['akita','秋田','Akita',39.7186,140.1024,'Asia/Tokyo'],
 ['yamagata','山形','Yamagata',38.2404,140.3634,'Asia/Tokyo'],
 ['fukushima','福島','Fukushima',37.7503,140.4676,'Asia/Tokyo'],
 ['mito','水戸','Mito',36.3418,140.4468,'Asia/Tokyo'],
 ['utsunomiya','宇都宮','Utsunomiya',36.5658,139.8836,'Asia/Tokyo'],
 ['maebashi','前橋','Maebashi',36.3912,139.0608,'Asia/Tokyo'],
 ['saitama','さいたま','Saitama',35.8570,139.6489,'Asia/Tokyo'],
 ['chiba','千葉','Chiba',35.6046,140.1232,'Asia/Tokyo'],
 ['yokohama','横浜','Yokohama',35.4478,139.6425,'Asia/Tokyo'],
 ['niigata','新潟','Niigata',37.9026,139.0232,'Asia/Tokyo'],
 ['toyama','富山','Toyama',36.6953,137.2113,'Asia/Tokyo'],
 ['kanazawa','金沢','Kanazawa',36.5947,136.6256,'Asia/Tokyo'],
 ['fukui','福井','Fukui',36.0652,136.2216,'Asia/Tokyo'],
 ['kofu','甲府','Kofu',35.6642,138.5684,'Asia/Tokyo'],
 ['nagano','長野','Nagano',36.6513,138.1810,'Asia/Tokyo'],
 ['gifu','岐阜','Gifu',35.3912,136.7223,'Asia/Tokyo'],
 ['shizuoka','静岡','Shizuoka',34.9769,138.3831,'Asia/Tokyo'],
 ['nagoya','名古屋','Nagoya',35.1802,136.9066,'Asia/Tokyo'],
 ['tsu','津','Tsu',34.7303,136.5086,'Asia/Tokyo'],
 ['otsu','大津','Otsu',35.0045,135.8686,'Asia/Tokyo'],
 ['kyoto','京都','Kyoto',35.0212,135.7556,'Asia/Tokyo'],
 ['osaka','大阪','Osaka',34.6863,135.5200,'Asia/Tokyo'],
 ['kobe','神戸','Kobe',34.6913,135.1830,'Asia/Tokyo'],
 ['nara','奈良','Nara',34.6853,135.8327,'Asia/Tokyo'],
 ['wakayama','和歌山','Wakayama',34.2260,135.1675,'Asia/Tokyo'],
 ['tottori','鳥取','Tottori',35.5039,134.2377,'Asia/Tokyo'],
 ['matsue','松江','Matsue',35.4723,133.0505,'Asia/Tokyo'],
 ['okayama','岡山','Okayama',34.6618,133.9344,'Asia/Tokyo'],
 ['hiroshima','広島','Hiroshima',34.3966,132.4596,'Asia/Tokyo'],
 ['yamaguchi','山口','Yamaguchi',34.1858,131.4714,'Asia/Tokyo'],
 ['tokushima','徳島','Tokushima',34.0658,134.5593,'Asia/Tokyo'],
 ['takamatsu','高松','Takamatsu',34.3401,134.0434,'Asia/Tokyo'],
 ['matsuyama','松山','Matsuyama',33.8416,132.7657,'Asia/Tokyo'],
 ['kochi','高知','Kochi',33.5597,133.5311,'Asia/Tokyo'],
 ['fukuoka','福岡','Fukuoka',33.6064,130.4183,'Asia/Tokyo'],
 ['saga','佐賀','Saga',33.2494,130.2988,'Asia/Tokyo'],
 ['nagasaki','長崎','Nagasaki',32.7448,129.8737,'Asia/Tokyo'],
 ['kumamoto','熊本','Kumamoto',32.7904,130.7426,'Asia/Tokyo'],
 ['oita','大分','Oita',33.2382,131.6126,'Asia/Tokyo'],
 ['miyazaki','宮崎','Miyazaki',31.9111,131.4239,'Asia/Tokyo'],
 ['kagoshima','鹿児島','Kagoshima',31.5602,130.5581,'Asia/Tokyo'],
 ['naha','那覇','Naha',26.2124,127.6809,'Asia/Tokyo'],
 ['new-york','ニューヨーク','New York',40.7128,-74.006,'America/New_York'],
 ['los-angeles','ロサンゼルス','Los Angeles',34.0522,-118.2437,'America/Los_Angeles'],
 ['london','ロンドン','London',51.5074,-0.1278,'Europe/London'],
 ['paris','パリ','Paris',48.8566,2.3522,'Europe/Paris'],
 ['sydney','シドニー','Sydney',-33.8688,151.2093,'Australia/Sydney'],
 ['shanghai','上海','Shanghai',31.2304,121.4737,'Asia/Shanghai'],
 ['beijing','北京','Beijing',39.9042,116.4074,'Asia/Shanghai'],
 ['kolkata','コルカタ','Kolkata',22.5726,88.3639,'Asia/Kolkata'],
 ['delhi','デリー','Delhi',28.6139,77.209,'Asia/Kolkata'],
];
const city=( [id,name,english,latitude,longitude,timeZone])=>Object.freeze({id,name,english,latitude,longitude,timeZone});
export const WORLD_CITIES=Object.freeze(rows.map(city));
const searchKey=value=>value.normalize('NFKC').toLowerCase().replace(/[\s・-]/gu,'');
export function searchCities(query=''){
 const key=searchKey(query);
 return WORLD_CITIES.filter(c=>[c.id,c.name,c.english,c.timeZone].some(value=>searchKey(value).includes(key)));
}
export function resolveLocation(db,{cityId,latitude,longitude,timeZone}){
 const preset=cityId===undefined?undefined:WORLD_CITIES.find(c=>c.id===cityId);
 if(cityId!==undefined&&!preset)throw new RangeError('Unknown city');
 latitude??=preset?.latitude; longitude??=preset?.longitude; timeZone??=preset?.timeZone;
 if(!Number.isFinite(latitude)||Math.abs(latitude)>=90||!Number.isFinite(longitude)||Math.abs(longitude)>180)throw new RangeError('Invalid chart coordinates');
 if(timeZone!==undefined&&!Object.hasOwn(db.zones,timeZone))throw new RangeError('Unsupported timezone');
 return {...preset,latitude,longitude,timeZone};
}
export function clocksAt(db,utcMs,timeZone){
 if(!Number.isFinite(utcMs)||utcMs<Date.parse(db.coverageUtc[0])||utcMs>=Date.parse(db.coverageUtc[1]))throw new RangeError('Outside supported time coverage');
 if(!Object.hasOwn(db.zones,timeZone))throw new RangeError('Unsupported timezone');
 const period=db.zones[timeZone];
 let index=period.length-1;
 while(index>=0&&period[index][0]*1000>utcMs)index--;
 const transition=period[index];
 if(!transition)throw new RangeError('No timezone data for instant');
 const offsetSeconds=transition[1];
 const clock=offset=>new Date(utcMs+offset*1000).toISOString().slice(0,19);
 return {utcMs,timeZone,offsetSeconds,local:clock(offsetSeconds),utc:clock(0),jst:clock(32400)};
}

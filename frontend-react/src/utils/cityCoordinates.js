const cities = {
  "Москва": { latitude: 55.7558, longitude: 37.6173, timezone: "Europe/Moscow" },
  "Санкт-Петербург": { latitude: 59.9343, longitude: 30.3351, timezone: "Europe/Moscow" },
  "Новосибирск": { latitude: 55.0084, longitude: 82.9357, timezone: "Asia/Novosibirsk" },
  "Екатеринбург": { latitude: 56.8389, longitude: 60.6057, timezone: "Asia/Yekaterinburg" },
  "Казань": { latitude: 55.7879, longitude: 49.1233, timezone: "Europe/Moscow" },
  "Нижний Новгород": { latitude: 56.2965, longitude: 43.9361, timezone: "Europe/Moscow" },
  "Красноярск": { latitude: 56.0153, longitude: 92.8932, timezone: "Asia/Krasnoyarsk" },
  "Челябинск": { latitude: 55.1644, longitude: 61.4368, timezone: "Asia/Yekaterinburg" },
  "Самара": { latitude: 53.1959, longitude: 50.1008, timezone: "Europe/Samara" },
  "Уфа": { latitude: 54.7388, longitude: 55.9721, timezone: "Asia/Yekaterinburg" },
  "Ростов-на-Дону": { latitude: 47.2357, longitude: 39.7015, timezone: "Europe/Moscow" },
  "Краснодар": { latitude: 45.0355, longitude: 38.9753, timezone: "Europe/Moscow" },
  "Омск": { latitude: 54.9885, longitude: 73.3242, timezone: "Asia/Omsk" },
  "Воронеж": { latitude: 51.6755, longitude: 39.2089, timezone: "Europe/Moscow" },
  "Пермь": { latitude: 58.0105, longitude: 56.2502, timezone: "Asia/Yekaterinburg" },
  "Волгоград": { latitude: 48.7080, longitude: 44.5133, timezone: "Europe/Volgograd" },
  "Саратов": { latitude: 51.5336, longitude: 46.0343, timezone: "Europe/Saratov" },
  "Тюмень": { latitude: 57.1530, longitude: 65.5343, timezone: "Asia/Yekaterinburg" },
  "Тольятти": { latitude: 53.5078, longitude: 49.4204, timezone: "Europe/Samara" },
  "Ижевск": { latitude: 56.8527, longitude: 53.2115, timezone: "Europe/Samara" },
  "Барнаул": { latitude: 53.3481, longitude: 83.7798, timezone: "Asia/Barnaul" },
  "Иркутск": { latitude: 52.2864, longitude: 104.2807, timezone: "Asia/Irkutsk" },
  "Хабаровск": { latitude: 48.4802, longitude: 135.0719, timezone: "Asia/Vladivostok" },
  "Ярославль": { latitude: 57.6261, longitude: 39.8845, timezone: "Europe/Moscow" },
  "Владивосток": { latitude: 43.1155, longitude: 131.8855, timezone: "Asia/Vladivostok" },
  "Махачкала": { latitude: 42.9849, longitude: 47.5047, timezone: "Europe/Moscow" },
  "Томск": { latitude: 56.4846, longitude: 84.9482, timezone: "Asia/Tomsk" },
  "Оренбург": { latitude: 51.7682, longitude: 55.0969, timezone: "Asia/Yekaterinburg" },
  "Кемерово": { latitude: 55.3552, longitude: 86.0873, timezone: "Asia/Novokuznetsk" },
  "Новокузнецк": { latitude: 53.7575, longitude: 87.1361, timezone: "Asia/Novokuznetsk" },
  "Рязань": { latitude: 54.6296, longitude: 39.7425, timezone: "Europe/Moscow" },
  "Астрахань": { latitude: 46.3497, longitude: 48.0408, timezone: "Europe/Astrakhan" },
  "Пенза": { latitude: 53.1950, longitude: 45.0183, timezone: "Europe/Moscow" },
  "Липецк": { latitude: 52.6088, longitude: 39.5992, timezone: "Europe/Moscow" },
  "Тула": { latitude: 54.1930, longitude: 37.6178, timezone: "Europe/Moscow" },
  "Калининград": { latitude: 54.7104, longitude: 20.4522, timezone: "Europe/Kaliningrad" },
  "Брянск": { latitude: 53.2436, longitude: 34.3634, timezone: "Europe/Moscow" },
  "Курск": { latitude: 51.7373, longitude: 36.1874, timezone: "Europe/Moscow" },
  "Белгород": { latitude: 50.5956, longitude: 36.5873, timezone: "Europe/Moscow" },
  "Сочи": { latitude: 43.5855, longitude: 39.7231, timezone: "Europe/Moscow" },
  "Архангельск": { latitude: 64.5393, longitude: 40.5187, timezone: "Europe/Moscow" },
  "Мурманск": { latitude: 68.9707, longitude: 33.0749, timezone: "Europe/Moscow" },
  "Ставрополь": { latitude: 45.0445, longitude: 41.9691, timezone: "Europe/Moscow" },
  "Грозный": { latitude: 43.3178, longitude: 45.6987, timezone: "Europe/Moscow" },
  "Якутск": { latitude: 62.0355, longitude: 129.6755, timezone: "Asia/Yakutsk" },
  "Петропавловск-Камчатский": { latitude: 53.0370, longitude: 158.6559, timezone: "Asia/Kamchatka" }
};

const popularOrder = [
  "Москва", "Санкт-Петербург", "Новосибирск", "Екатеринбург", "Казань",
  "Нижний Новгород", "Красноярск", "Челябинск", "Самара", "Уфа",
  "Ростов-на-Дону", "Краснодар", "Омск", "Воронеж", "Пермь",
  "Волгоград", "Саратов", "Тюмень", "Тольятти", "Ижевск", "Барнаул",
  "Иркутск", "Хабаровск", "Ярославль", "Владивосток", "Махачкала",
  "Томск", "Оренбург", "Кемерово", "Новокузнецк", "Рязань", "Астрахань",
  "Пенза", "Липецк", "Тула", "Калининград", "Брянск", "Курск",
  "Белгород", "Сочи", "Архангельск", "Мурманск", "Ставрополь", "Грозный",
  "Якутск", "Петропавловск-Камчатский"
];

export function getCityCoordinates(city) {
  return cities[city] || null;
}

export function getPopularCities() {
  return popularOrder.map((name) => ({ name, ...cities[name] }));
}

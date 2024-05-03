let months = [
  "Янв",
  "Фев",
  "Мар",
  "Апр",
  "Мая",
  "Июня",
  "Июля",
  "Авг",
  "Сент",
  "Окт",
  "Нояб",
  "Дек",
];
let days = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

export const getDay = (timestamp) => {
  let date = new Date(timestamp);
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
};

export const getFullDay = (timestamp) => {
  let date = new Date(timestamp);
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear}`;
};

import { getMercurySign } from "./mercury";


export function getPlanetSign(name, data) {

  switch(name) {

    case "Солнце":
      return data.sun;

    case "Луна":
      return data.moon;

    case "Асцендент":
      return data.ascendant;

    case "Меркурий":
      return data.mercury;

    default:
      return "Расчёт позже";
  }

}
import { sequelize } from '../config/sequelize.js';

export function getModels() {
  return sequelize.models;
}

export default getModels;

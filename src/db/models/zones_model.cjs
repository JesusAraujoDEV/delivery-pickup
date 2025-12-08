const { Model, DataTypes, Sequelize } = require('sequelize');

const ZONES_TABLE = 'dp_zones';

const ZonesSchema = {
  zone_id: {
    allowNull: false,
    primaryKey: true,
    type: DataTypes.UUID,
  },
  zone_name: {
    allowNull: false,
    type: DataTypes.STRING(100),
    unique: true,
  },
  estimated_eta_minutes: {
    allowNull: false,
    type: DataTypes.INTEGER,
  },
  shipping_cost: {
    allowNull: false,
    type: DataTypes.DECIMAL(10,2),
  },
  coverage_data: {
    allowNull: true,
    type: DataTypes.JSONB,
  },
  is_active: {
    allowNull: false,
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
};

class Zones extends Model {
  static associate(models) {
    this.hasMany(models.Notes, { as: 'notes', foreignKey: 'zone_id' });
  }

  static config(sequelize) {
    return {
      sequelize,
      tableName: ZONES_TABLE,
      modelName: 'Zones',
      timestamps: false,
      underscored: true,
    };
  }
}

module.exports = { ZONES_TABLE, ZonesSchema, Zones };
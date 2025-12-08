const { Model, DataTypes } = require('sequelize');

const THRESHOLDS_TABLE = 'dp_thresholds';

const ThresholdsSchema = {
  threshold_id: {
    allowNull: false,
    primaryKey: true,
    type: DataTypes.UUID,
  },
  metric_affected: {
    allowNull: false,
    type: DataTypes.STRING(50),
    unique: true,
  },
  value_critical: {
    allowNull: false,
    type: DataTypes.INTEGER,
  },
  is_active: {
    allowNull: false,
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
};

class Thresholds extends Model {
  static config(sequelize) {
    return {
      sequelize,
      tableName: THRESHOLDS_TABLE,
      modelName: 'Thresholds',
      timestamps: false,
      underscored: true,
    };
  }
}

module.exports = { THRESHOLDS_TABLE, ThresholdsSchema, Thresholds };
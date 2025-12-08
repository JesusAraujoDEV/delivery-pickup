const { Model, DataTypes } = require('sequelize');

const MANAGERS_TABLE = 'dp_managers';

const ManagersSchema = {
  manager_id: {
    allowNull: false,
    primaryKey: true,
    type: DataTypes.UUID,
  },
  user_id: {
    allowNull: false,
    type: DataTypes.UUID,
    unique: true,
  },
  full_name: {
    allowNull: false,
    type: DataTypes.STRING(100),
  },
  role: {
    allowNull: false,
    type: DataTypes.STRING(50),
  },
  is_active: {
    allowNull: false,
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
};

class Managers extends Model {
  static associate(models) {
    this.hasMany(models.Logs, { as: 'logs', foreignKey: 'manager_id' });
  }

  static config(sequelize) {
    return {
      sequelize,
      tableName: MANAGERS_TABLE,
      modelName: 'Managers',
      timestamps: false,
      underscored: true,
    };
  }
}

module.exports = { MANAGERS_TABLE, ManagersSchema, Managers };
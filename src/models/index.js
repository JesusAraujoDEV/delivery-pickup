let models = {};

export default function defineModels(sequelize, DataTypes) {
  const Zones = sequelize.define('dp_zones', {
    zone_id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    zone_name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    estimated_eta_minutes: { type: DataTypes.INTEGER, allowNull: false },
    shipping_cost: { type: DataTypes.DECIMAL(10,2), allowNull: false },
    coverage_data: { type: DataTypes.JSONB },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  }, { timestamps: false });

  const Thresholds = sequelize.define('dp_thresholds', {
    threshold_id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    metric_affected: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    value_critical: { type: DataTypes.INTEGER, allowNull: false },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  }, { timestamps: false });

  const Managers = sequelize.define('dp_managers', {
    manager_id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    user_id: { type: DataTypes.UUID, allowNull: false, unique: true },
    full_name: { type: DataTypes.STRING(100), allowNull: false },
    role: { type: DataTypes.STRING(50), allowNull: false },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  }, { timestamps: false });

  const Notes = sequelize.define('dp_notes', {
    note_id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    readable_id: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    order_source_id: { type: DataTypes.STRING(50) },
    customer_name: { type: DataTypes.STRING(100), allowNull: false },
    customer_phone: { type: DataTypes.STRING(20), allowNull: false },
    customer_email: { type: DataTypes.STRING(100) },
    delivery_address: { type: DataTypes.TEXT },
    service_type: { type: DataTypes.ENUM('DELIVERY', 'PICKUP'), allowNull: false },
    current_status: { type: DataTypes.STRING(30), allowNull: false },
    monto_total: { type: DataTypes.DECIMAL(10,2), allowNull: false },
    monto_costo_envio: { type: DataTypes.DECIMAL(10,2), allowNull: false },
    timestamp_creation: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    timestamp_approved: { type: DataTypes.DATE },
    timestamp_ready: { type: DataTypes.DATE },
    timestamp_dispatched: { type: DataTypes.DATE },
    timestamp_closure: { type: DataTypes.DATE },
  }, { timestamps: false });

  const NoteItems = sequelize.define('dp_note_items', {
    item_id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    product_name: { type: DataTypes.STRING(150), allowNull: false },
    quantity: { type: DataTypes.INTEGER, allowNull: false },
    unit_price: { type: DataTypes.DECIMAL(10,2), allowNull: false },
    subtotal: { type: DataTypes.DECIMAL(10,2), allowNull: true }, // Will compute hook
  }, { timestamps: false });

  const Logs = sequelize.define('dp_logs', {
    log_id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    timestamp_transition: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    status_from: { type: DataTypes.STRING(30) },
    status_to: { type: DataTypes.STRING(30), allowNull: false },
    cancellation_reason: { type: DataTypes.TEXT },
  }, { timestamps: false });

  // Associations
  Notes.belongsTo(Zones, { foreignKey: 'zone_id' });
  Zones.hasMany(Notes, { foreignKey: 'zone_id' });

  NoteItems.belongsTo(Notes, { foreignKey: 'note_id' });
  Notes.hasMany(NoteItems, { foreignKey: 'note_id' });

  Logs.belongsTo(Notes, { foreignKey: 'note_id' });
  Notes.hasMany(Logs, { foreignKey: 'note_id' });

  Logs.belongsTo(Managers, { foreignKey: 'manager_id' });
  Managers.hasMany(Logs, { foreignKey: 'manager_id' });

  // Hooks
  NoteItems.addHook('beforeSave', (item) => {
    if (item.quantity != null && item.unit_price != null) {
      item.subtotal = (Number(item.quantity) * Number(item.unit_price)).toFixed(2);
    }
  });

  models = { sequelize, Zones, Thresholds, Managers, Notes, NoteItems, Logs };
  return models;
}

export function getModels() { return models; }

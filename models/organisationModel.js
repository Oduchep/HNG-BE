import { v4 as uuidv4 } from 'uuid';
import { sequelize } from '../db.config.js';
import { DataTypes } from 'sequelize';

const OrganisationModel = sequelize.define(
  'Organisation',
  {
    orgId: {
      type: DataTypes.UUID,
      defaultValue: uuidv4,
      allowNull: false,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      defaultValue: '',
    },
  },
  {
    timestamps: true,
  },
);

OrganisationModel.associate = function (models) {
  OrganisationModel.belongsToMany(models.User, {
    through: 'UserOrganisations',
    as: 'users',
    foreignKey: 'orgId',
  });
};

export default OrganisationModel;

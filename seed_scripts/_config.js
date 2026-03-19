'use strict';

require('dotenv').config();
const path = require('path');
const { Op, QueryTypes } = require('sequelize');
const crypto = require('crypto');
const fs = require('fs');

// Configure logging
const logger = console;

// Utility functions
const randBetween = (min, max) => Math.random() * (max - min) + min;
const randInt = (min, max) => Math.floor(randBetween(min, max + 1));
const randomBool = () => Math.random() > 0.5;
const randomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
const nowMinus = (minutes) => new Date(Date.now() - minutes * 60000);
const randomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomString = (length = 10) => {
  return crypto.randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length);
};

// Helper function to safely handle model operations
async function safeModelOperation(operation, modelName, errorMessage) {
  try {
    const result = await operation();
    return { success: true, result };
  } catch (error) {
    logger.error(`[seed] Error in ${modelName}: ${errorMessage}`, error.message);
    if (process.env.NODE_ENV === 'development') {
      logger.error(error.stack);
    }
    return { success: false, error };
  }
}

// Helper function to check if a table exists
async function tableExists(sequelize, tableName) {
  const query = `
    SELECT COUNT(*) as count 
    FROM information_schema.tables 
    WHERE table_schema = DATABASE() 
    AND table_name = '${tableName}'
  `;
  const [results] = await sequelize.query(query, { type: QueryTypes.SELECT });
  return results && results.count > 0;
}

// Helper function to upsert records
async function upsert(Model, where, values) {
  const found = await Model.findOne({ where });
  if (found) {
    return found.update(values);
  }
  return Model.create({ ...where, ...values });
}

// Sample data generators
const sampleData = {
  firstNames: ['John', 'Jane', 'Michael', 'Emily', 'David', 'Sarah', 'Robert', 'Jennifer', 'William', 'Elizabeth'],
  lastNames: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Garcia', 'Rodriguez', 'Wilson'],
  domains: ['gmail.com', 'yahoo.com', 'outlook.com', 'protonmail.com', 'icloud.com'],
  phonePrefixes: ['+1', '+44', '+91', '+61', '+81'],
  
  generateName: function() {
    return `${randomElement(this.firstNames)} ${randomElement(this.lastNames)}`;
  },
  
  generateEmail: function(name) {
    const [firstName, lastName] = name.toLowerCase().split(' ');
    const domain = randomElement(this.domains);
    return `${firstName}.${lastName}@${domain}`;
  },
  
  generatePhone: function() {
    const prefix = randomElement(this.phonePrefixes);
    const number = Math.floor(1000000000 + Math.random() * 9000000000).toString().substring(0, 10);
    return `${prefix}${number}`;
  },
  
  generateAddress: function() {
    const streets = ['Main St', 'Oak Ave', 'Pine St', 'Maple Dr', 'Cedar Ln'];
    const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'];
    const states = ['NY', 'CA', 'IL', 'TX', 'AZ'];
    
    return {
      street: `${randInt(1, 9999)} ${randomElement(streets)}`,
      city: randomElement(cities),
      state: randomElement(states),
      zip: randInt(10000, 99999).toString(),
      country: 'USA'
    };
  }
};

module.exports = {
  randBetween,
  randInt,
  randomBool,
  randomDate,
  nowMinus,
  randomElement,
  randomString,
  safeModelOperation,
  tableExists,
  upsert,
  sampleData,
  logger
};

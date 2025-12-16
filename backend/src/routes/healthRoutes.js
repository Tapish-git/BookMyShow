/**
 * Health Check Routes
 * 
 * Defines health monitoring and system status endpoints.
 * Used by load balancers, monitoring systems, and operations teams.
 * 
 * @author Tapish Bagdi
 * @version 1.0.0
 */

const express = require('express');
const { healthCheck } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler');
const { logPerformance } = require('../middleware/logger');

const router = express.Router();

/**
 * @route GET /api/v1/health
 * @description Basic health check endpoint
 * @access Public
 * @returns {Object} Health status and basic metrics
 */
router.get('/',
  asyncHandler(async (req, res) => {
    const startTime = Date.now();
    
    try {
      const health = await healthCheck();
      
      logPerformance('healthCheck', Date.now() - startTime, {
        status: health.status,
        dbConnection: health.connection,
      });
      
      res.status(health.status === 'healthy' ? 200 : 503).json(health);
    } catch (error) {
      logPerformance('healthCheck', Date.now() - startTime, {
        error: error.message,
      });
      
      res.status(503).json({
        status: 'unhealthy',
        connection: 'failed',
        error: error.message,
        timestamp: new Date(),
      });
    }
  })
);

/**
 * @route GET /api/v1/health/detailed
 * @description Detailed health check with system information
 * @access Public
 */
router.get('/detailed',
  asyncHandler(async (req, res) => {
    const startTime = Date.now();
    
    try {
      const health = await healthCheck();
      
      // Additional system information
      const systemInfo = {
        nodeVersion: process.version,
        platform: process.platform,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date(),
      };
      
      logPerformance('detailedHealthCheck', Date.now() - startTime, {
        status: health.status,
        uptime: systemInfo.uptime,
      });
      
      res.status(health.status === 'healthy' ? 200 : 503).json({
        ...health,
        system: systemInfo,
      });
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date(),
      });
    }
  })
);

module.exports = router;
#!/usr/bin/env node

/**
 * MCP Connection Tester - Reusable Package
 *
 * This tests the MCP server functionality and validates
 * that all Context7 resources and tools are working properly.
 */

import { spawn } from 'child_process';

/**


 * MCPConnectionTester class implementation


 *


 * Provides functionality for mcpconnectiontester operations


 */


/**


 * MCPConnectionTester class implementation


 *


 * Provides functionality for mcpconnectiontester operations


 */


export class MCPConnectionTester {
  constructor(config = {}) {
    this.config = {
      serverPath: config.serverPath || 'src/mcp-server.js',
      projectRoot: config.projectRoot || process.cwd(),
      timeout: config.timeout || 30000,
      ...config
    };

    this.serverProcess = null;
    this.testResults = [];
  }  /**
   * Performs the specified operation
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Performs the specified operation
   * @returns {Promise} Promise that resolves with the result
   */


  async startServer() {
    // LOG: 🚀 Starting Context7 MCP Server...
    const serverPath = this.config.serverPath.startsWith('/')
      ? this.config.serverPath
      : `${this.config.projectRoot}/${this.config.serverPath}`;

    this.serverProcess = spawn('node', [serverPath], {
      stdio: ['pipe', 'pipe', 'inherit'],
      cwd: this.config.projectRoot,
      env: {
        ...process.env,
        PROJECT_ROOT: this.config.projectRoot,
        CODEFORTIFY_PATH: this.config.codefortifyPath || '.codefortify',
        NODE_ENV: 'test'
      }
    });

    // Give the server a moment to start
    await new Promise(resolve => setTimeout(resolve, 1000));    /**
   * Performs the specified operation
   * @param {boolean} this.serverProcess.killed
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {boolean} this.serverProcess.killed
   * @returns {boolean} True if successful, false otherwise
   */


    if (this.serverProcess.killed) {
      throw new Error('MCP Server failed to start');
    }

    // LOG: ✅ MCP Server started successfully
    return this.serverProcess;
  }  /**
   * Tests the functionality
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Tests the functionality
   * @returns {Promise} Promise that resolves with the result
   */


  async testResourceListing() {
    // LOG: 🧪 Testing resource listing...
    const request = {
      jsonrpc: '2.0',
      id: 1,
      method: 'resources/list',
      params: {}
    };

    try {
      const response = await this.sendRequest(request);      /**
   * Performs the specified operation
   * @param {any} response.result && response.result.resources
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} response.result && response.result.resources
   * @returns {any} The operation result
   */


      if (response.result && response.result.resources) {
        const resourceCount = response.result.resources.length;
        // LOG: `✅ Found ${resourceCount} Context7 resources`
        // List all resources
        response.result.resources.forEach((resource, index) => {
          // LOG: `   ${index + 1}. ${resource.name} (${resource.uri})`
        });

        this.testResults.push({
          test: 'Resource Listing',
          status: 'PASS',
          details: `${resourceCount} resources found`
        });

        return response.result.resources;
      } else {
        throw new Error('No resources found in response');
      }
    } catch (error) {
      // ERROR: ❌ Resource listing failed:, error.message
      this.testResults.push({
        test: 'Resource Listing',
        status: 'FAIL',
        error: error.message
      });
      return [];
    }
  }  /**
   * Reads data from file
   * @param {any} resources
   * @param {any} maxResourcesToTest - Optional parameter
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Reads data from file
   * @param {any} resources
   * @param {any} maxResourcesToTest - Optional parameter
   * @returns {Promise} Promise that resolves with the result
   */


  async testResourceReading(resources, maxResourcesToTest = 3) {
    // LOG: 🧪 Testing resource reading...
    const resourcesToTest = resources.slice(0, maxResourcesToTest);    /**
   * Performs the specified operation
   * @param {any} const resource of resourcesToTest
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} const resource of resourcesToTest
   * @returns {any} The operation result
   */


    for (const resource of resourcesToTest) {
      try {
        const request = {
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'resources/read',
          params: {
            uri: resource.uri
          }
        };

        const response = await this.sendRequest(request);        /**
   * Performs the specified operation
   * @param {any} response.result && response.result.contents
   * @returns {any} The operation result
   */
        /**
   * Performs the specified operation
   * @param {any} response.result && response.result.contents
   * @returns {any} The operation result
   */


        if (response.result && response.result.contents) {
          // LOG: `   ✅ Successfully read: ${resource.name}`
          const content = response.result.contents[0];
          // LOG: `      Content length: ${content.text.length} characters`
          // LOG: `      MIME type: ${content.mimeType}`
        } else {
          throw new Error('No content found in response');
        }

        this.testResults.push({
          test: `Resource Reading: ${resource.name}`,
          status: 'PASS',
          details: 'Content retrieved successfully'
        });

      } catch (error) {
        // ERROR: `   ❌ Failed to read ${resource.name}:`, error.message
        this.testResults.push({
          test: `Resource Reading: ${resource.name}`,
          status: 'FAIL',
          error: error.message
        });
      }
    }
  }  /**
   * Tests the functionality
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Tests the functionality
   * @returns {Promise} Promise that resolves with the result
   */


  async testToolListing() {
    // LOG: 🧪 Testing tool listing...
    const request = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {}
    };

    try {
      const response = await this.sendRequest(request);      /**
   * Performs the specified operation
   * @param {any} response.result && response.result.tools
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} response.result && response.result.tools
   * @returns {any} The operation result
   */


      if (response.result && response.result.tools) {
        const toolCount = response.result.tools.length;
        // LOG: `✅ Found ${toolCount} Context7 tools`
        // List all tools
        response.result.tools.forEach((tool, index) => {
          // LOG: `   ${index + 1}. ${tool.name}: ${tool.description}`
        });

        this.testResults.push({
          test: 'Tool Listing',
          status: 'PASS',
          details: `${toolCount} tools found`
        });

        return response.result.tools;
      } else {
        throw new Error('No tools found in response');
      }
    } catch (error) {
      // ERROR: ❌ Tool listing failed:, error.message
      this.testResults.push({
        test: 'Tool Listing',
        status: 'FAIL',
        error: error.message
      });
      return [];
    }
  }  /**
   * Tests the functionality
   * @param {any} tools
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Tests the functionality
   * @param {any} tools
   * @returns {Promise} Promise that resolves with the result
   */


  async testToolExecution(tools) {
    // LOG: 🧪 Testing tool execution...
    // Test validate_context7_compliance tool
    const validationTool = tools.find(tool => tool.name === 'validate_context7_compliance');    /**
   * Performs the specified operation
   * @param {number} validationTool
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {number} validationTool
   * @returns {any} The operation result
   */

    if (validationTool) {
      await this.testValidationTool();
    }

    // Test get_pattern_examples tool
    const patternTool = tools.find(tool => tool.name === 'get_pattern_examples');    /**
   * Performs the specified operation
   * @param {any} patternTool
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} patternTool
   * @returns {any} The operation result
   */

    if (patternTool) {
      await this.testPatternTool();
    }

    // Test check_naming_conventions tool
    const namingTool = tools.find(tool => tool.name === 'check_naming_conventions');    /**
   * Performs the specified operation
   * @param {any} namingTool
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} namingTool
   * @returns {any} The operation result
   */

    if (namingTool) {
      await this.testNamingTool();
    }
  }  /**
   * Tests the functionality
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Tests the functionality
   * @returns {Promise} Promise that resolves with the result
   */


  async testValidationTool() {
    try {
      const request = {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: {
          name: 'validate_context7_compliance',
          arguments: {
            code: 'const MyComponent: React.FC = () => { return <div>Hello</div>; };',
            language: 'typescript',
            component_type: 'react'
          }
        }
      };

      const response = await this.sendRequest(request);      /**
   * Performs the specified operation
   * @param {any} response.result && response.result.content
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} response.result && response.result.content
   * @returns {any} The operation result
   */


      if (response.result && response.result.content) {
        // LOG:    ✅ Context7 validation tool executed successfully
        const result = JSON.parse(response.result.content[0].text);
        // LOG: `      Compliance score: ${result.compliance_score}/100`
        // LOG: `      Issues found: ${result.issues.length}`
        this.testResults.push({
          test: 'Tool Execution: validate_context7_compliance',
          status: 'PASS',
          details: `Compliance score: ${result.compliance_score}`
        });
      } else {
        throw new Error('No result from tool execution');
      }

    } catch (error) {
      // ERROR:    ❌ Validation tool execution failed:, error.message
      this.testResults.push({
        test: 'Tool Execution: validate_context7_compliance',
        status: 'FAIL',
        error: error.message
      });
    }
  }  /**
   * Tests the functionality
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Tests the functionality
   * @returns {Promise} Promise that resolves with the result
   */


  async testPatternTool() {
    try {
      const request = {
        jsonrpc: '2.0',
        id: 4,
        method: 'tools/call',
        params: {
          name: 'get_pattern_examples',
          arguments: {
            pattern_type: 'component',
            framework: 'react'
          }
        }
      };

      const response = await this.sendRequest(request);      /**
   * Performs the specified operation
   * @param {any} response.result && response.result.content
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} response.result && response.result.content
   * @returns {any} The operation result
   */


      if (response.result && response.result.content) {
        // LOG:    ✅ Pattern examples tool executed successfully
        const pattern = response.result.content[0].text;
        // LOG: `      Pattern length: ${pattern.length} characters`
        this.testResults.push({
          test: 'Tool Execution: get_pattern_examples',
          status: 'PASS',
          details: 'Pattern retrieved successfully'
        });
      } else {
        throw new Error('No pattern from tool execution');
      }

    } catch (error) {
      // ERROR:    ❌ Pattern tool execution failed:, error.message
      this.testResults.push({
        test: 'Tool Execution: get_pattern_examples',
        status: 'FAIL',
        error: error.message
      });
    }
  }  /**
   * Tests the functionality
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Tests the functionality
   * @returns {Promise} Promise that resolves with the result
   */


  async testNamingTool() {
    try {
      const request = {
        jsonrpc: '2.0',
        id: 5,
        method: 'tools/call',
        params: {
          name: 'check_naming_conventions',
          arguments: {
            names: ['MyComponent', 'useMyHook', 'my-file.tsx'],
            context: 'component'
          }
        }
      };

      const response = await this.sendRequest(request);      /**
   * Performs the specified operation
   * @param {any} response.result && response.result.content
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} response.result && response.result.content
   * @returns {any} The operation result
   */


      if (response.result && response.result.content) {
        // LOG:    ✅ Naming conventions tool executed successfully
        const result = JSON.parse(response.result.content[0].text);
        // LOG: `      Checked ${result.results.length} names`
        this.testResults.push({
          test: 'Tool Execution: check_naming_conventions',
          status: 'PASS',
          details: `${result.results.length} names validated`
        });
      } else {
        throw new Error('No result from naming tool execution');
      }

    } catch (error) {
      // ERROR:    ❌ Naming tool execution failed:, error.message
      this.testResults.push({
        test: 'Tool Execution: check_naming_conventions',
        status: 'FAIL',
        error: error.message
      });
    }
  }  /**
   * Performs the specified operation
   * @param {any} request
   * @param {any} timeoutMs - Optional parameter
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Performs the specified operation
   * @param {any} request
   * @param {any} timeoutMs - Optional parameter
   * @returns {Promise} Promise that resolves with the result
   */


  async sendRequest(request, timeoutMs = 5000) {
    return new Promise((resolve, reject) => {
      const requestStr = JSON.stringify(request) + '\n';
      let responseStr = '';

      const timeout = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, timeoutMs);

      const onData = (data) => {
        clearTimeout(timeout);
        responseStr = data.toString().trim();

        try {
          const response = JSON.parse(responseStr);
          resolve(response);
        } catch (error) {
          reject(new Error(`Invalid JSON response: ${responseStr}`));
        }
      };

      // Handle case where server might send multiple responses
      this.serverProcess.stdout.once('data', onData);

      try {
        this.serverProcess.stdin.write(requestStr);
      } catch (error) {
        clearTimeout(timeout);
        reject(new Error(`Failed to send request: ${error.message}`));
      }
    });
  }  /**
   * Performs the specified operation
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Performs the specified operation
   * @returns {Promise} Promise that resolves with the result
   */


  async cleanup() {  /**
   * Performs the specified operation
   * @param {boolean} this.serverProcess && !this.serverProcess.killed
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {boolean} this.serverProcess && !this.serverProcess.killed
   * @returns {boolean} True if successful, false otherwise
   */

    if (this.serverProcess && !this.serverProcess.killed) {
      // LOG: 🧹 Shutting down MCP Server...
      this.serverProcess.kill('SIGTERM');

      // Wait for graceful shutdown
      await new Promise(resolve => setTimeout(resolve, 1000));      /**
   * Performs the specified operation
   * @param {boolean} !this.serverProcess.killed
   * @returns {boolean} True if successful, false otherwise
   */
      /**
   * Performs the specified operation
   * @param {boolean} !this.serverProcess.killed
   * @returns {boolean} True if successful, false otherwise
   */


      if (!this.serverProcess.killed) {
        this.serverProcess.kill('SIGKILL');
      }
    }
  }  /**
   * Generates new data
   * @returns {any} The created resource
   */
  /**
   * Generates new data
   * @returns {any} The created resource
   */


  generateReport() {
    // LOG: \\n📊 Test Results Summary:
    // LOG: = .repeat(50)
    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;
    const total = this.testResults.length;

    // LOG: `Total Tests: ${total}`
    // LOG: `Passed: ${passed} ✅`
    // LOG: `Failed: ${failed} ❌`
    // LOG: `Success Rate: ${Math.round((passed / total) * 100)}%`
    // LOG: \\nDetailed Results:
    this.testResults.forEach((result, index) => {
      const status = result.status === 'PASS' ? '✅' : '❌';
      // LOG: `${index + 1}. ${status} ${result.test}`
      /**
   * Performs the specified operation
   * @param {any} result.details
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} result.details
   * @returns {any} The operation result
   */
      if (result.details) {
        // LOG: `   Details: ${result.details}`
      }      /**
   * Performs the specified operation
   * @param {any} result.error
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} result.error
   * @returns {any} The operation result
   */

      if (result.error) {
        // LOG: `   Error: ${result.error}`
      }
    });

    return {
      passed,
      failed,
      total,
      successRate: Math.round((passed / total) * 100),
      results: this.testResults
    };
  }  /**
   * Runs the specified task
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Runs the specified task
   * @returns {Promise} Promise that resolves with the result
   */


  async runTests() {
    // LOG: 🧪 Starting Context7 MCP Server Tests
    // LOG: `Project: ${this.config.projectRoot}`
    // LOG: `Server: ${this.config.serverPath}`
    // LOG: = .repeat(50)
    try {
      // Start the server
      await this.startServer();

      // Test resource functionality
      const resources = await this.testResourceListing();      /**
   * Performs the specified operation
   * @param {any} resources.length > 0
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} resources.length > 0
   * @returns {any} The operation result
   */

      if (resources.length > 0) {
        await this.testResourceReading(resources);
      }

      // Test tool functionality
      const tools = await this.testToolListing();      /**
   * Performs the specified operation
   * @param {any} tools.length > 0
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} tools.length > 0
   * @returns {any} The operation result
   */

      if (tools.length > 0) {
        await this.testToolExecution(tools);
      }

      // LOG: \\n✅ All tests completed
    } catch (error) {
      // ERROR: 💥 Test suite failed:, error.message
      this.testResults.push({
        test: 'Test Suite Setup',
        status: 'FAIL',
        error: error.message
      });
    } finally {
      await this.cleanup();
    }

    const report = this.generateReport();
    return {
      success: report.failed === 0,
      report
    };
  }

  // Static factory methods
  static async testProject(projectRoot, options = {}) {
    const tester = new MCPConnectionTester({
      projectRoot,
      ...options
    });

    return await tester.runTests();
  }

  static async quickTest(serverPath, options = {}) {
    const tester = new MCPConnectionTester({
      serverPath,
      ...options
    });

    return await tester.runTests();
  }
}

// Run tests if this file is executed directly
if (import.meta.url === new URL(process.argv[1], 'file:').href) {
  const projectRoot = process.argv[2] || process.cwd();
  const serverPath = process.argv[3] || 'src/mcp-server.js';

  MCPConnectionTester.testProject(projectRoot, { serverPath })
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      // ERROR: Test error:, error
      process.exit(1);
    });
}
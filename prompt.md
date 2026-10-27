You are an expert Full-Stack Software Architect and Developer. I need you to create a complete, production-ready Field Services Web Application with the following requirements:

## Project Specifications

### Technology Stack (Latest Stable Versions)
- **Frontend:** Angular (latest version) + Bootstrap (latest version) + SASS
- **UI Type:** Dashboard/Admin UI with responsive design
- **Backend:** Spring Boot (latest version)
- **Database:** MySQL (latest version)
- **Additional Tools:** Use the latest stable versions of all supporting libraries and frameworks

### Project Type
Field Services Web Application - A comprehensive solution for managing field operations, service requests, technician assignments, and administrative tasks.

## Project Requirements

### 1. Architecture & Structure

#### Frontend (Angular)
- Implement Angular modular architecture with feature modules
- Create shared/core modules for reusable components and services
- Follow Angular style guide and best practices
- Implement lazy loading for optimal performance
- Use Angular routing with route guards
- Implement state management (NgRx or similar)
- Create reusable UI components library

#### Backend (Spring Boot)
- Implement layered architecture (Controller → Service → Repository)
- Use Spring Boot 3.x with Java 17+ or latest LTS
- Implement RESTful API design principles
- Use Spring Data JPA for database operations
- Implement Spring Security for authentication/authorization
- Add proper exception handling with @ControllerAdvice
- Use DTOs and MapStruct for object mapping

#### Database (MySQL)
- Design normalized database schema
- Create proper relationships and constraints
- Implement database indexing for performance
- Use migrations (Flyway or Liquibase)
- Design for data integrity and consistency

### 2. Dashboard/Admin UI Features
- Responsive dashboard with widgets and charts
- User management interface
- Field service request management
- Technician assignment and tracking
- Real-time status updates
- Reports and analytics section
- Settings and configuration panel
- Mobile-responsive design using Bootstrap grid

### 3. Code Quality & Best Practices

#### Angular Best Practices
- Use OnPush change detection strategy
- Implement RxJS operators efficiently
- Follow reactive programming patterns
- Use Angular CLI for code generation
- Implement proper type safety with TypeScript
- Use async pipe for subscriptions
- Implement proper component lifecycle management

#### Spring Boot Best Practices
- Use dependency injection properly
- Implement transaction management
- Use profiles for different environments
- Follow RESTful naming conventions
- Implement proper logging with SLF4J
- Use Spring Boot Actuator for monitoring
- Implement API versioning

#### SASS Best Practices
- Use variables for colors, fonts, and spacing
- Implement mixins for reusable styles
- Follow BEM or similar naming convention
- Create modular and maintainable stylesheets
- Use Bootstrap utilities and customize Bootstrap variables

### 4. Security Implementation
- **Authentication:** JWT-based authentication with Spring Security
- **Authorization:** Role-based access control (RBAC)
- **Frontend Security:** 
  - HTTP interceptors for token management
  - Route guards for protected routes
  - XSS prevention
- **Backend Security:**
  - CORS configuration
  - SQL injection prevention with JPA
  - Password encryption with BCrypt
  - Rate limiting with Spring Boot
  - Secure headers configuration
- **API Security:** 
  - Input validation with Bean Validation
  - Request/response encryption for sensitive data
  - API authentication and authorization
- Environment variable management (application.properties/application.yml)

### 5. Performance Optimization

#### Frontend Performance
- Angular AOT (Ahead-of-Time) compilation
- Lazy loading of modules
- OnPush change detection
- Virtual scrolling for large lists
- Image optimization and lazy loading
- Bundle size optimization with tree shaking
- Service worker for PWA capabilities
- Implement caching strategies with HTTP interceptors

#### Backend Performance
- Database connection pooling (HikariCP)
- Query optimization and proper indexing
- Implement caching with Spring Cache (Redis or Ehcache)
- Use pagination for large datasets
- Async processing for long-running tasks
- Response compression (gzip)
- API response optimization with DTOs

#### Database Performance
- Proper indexing strategy
- Query optimization
- Connection pooling
- Use of prepared statements
- Database-level caching

### 6. SEO Optimization
- Angular Universal for Server-Side Rendering (SSR)
- Proper meta tags management
- Structured data implementation
- XML sitemap generation
- Robots.txt configuration
- Canonical URLs
- Open Graph tags for social sharing
- Page title and description optimization
- Semantic HTML structure
- Fast page load times

### 7. Technology Stack Versions Documentation

Document the following versions:
- Angular version
- Angular CLI version
- TypeScript version
- Bootstrap version
- SASS/SCSS version
- RxJS version
- Spring Boot version
- Java version
- Spring Framework version
- Spring Security version
- Spring Data JPA version
- MySQL version
- MySQL Connector/J version
- All npm packages (package.json)
- All Maven dependencies (pom.xml)

### 8. Documentation Requirements

Create THREE comprehensive documentation files:

#### README.md (Main Documentation)
- Project overview and field services app description
- Complete technology stack with version numbers
- System architecture diagram (ASCII or description)
- Prerequisites and system requirements
- Installation instructions:
  * MySQL database setup
  * Backend setup (Spring Boot)
  * Frontend setup (Angular)
- Configuration guide:
  * Database configuration
  * Application properties
  * Environment variables
- How to run in development mode
- How to build for production
- Deployment instructions (backend and frontend)
- Environment variables explanation
- API documentation overview
- Testing instructions
- Common troubleshooting issues
- Contributing guidelines
- License information

#### DEVELOPER_GUIDE.md (Technical Documentation)
- Complete project structure breakdown (frontend and backend)
- Explanation of each directory and its purpose

**Frontend Structure:**
- `/src/app` - Core Angular application
  * `/core` - Singleton services, guards, interceptors
  * `/shared` - Shared components, directives, pipes
  * `/features` - Feature modules (dashboard, users, services, etc.)
  * `/models` - TypeScript interfaces and classes
  * `/services` - Business logic services
  * `/guards` - Route guards
  * `/interceptors` - HTTP interceptors
- `/src/assets` - Static assets (images, fonts, etc.)
- `/src/styles` - Global SASS files
- `/src/environments` - Environment configurations

**Backend Structure:**
- `/src/main/java/com/[company]/fieldservices`
  * `/controller` - REST controllers
  * `/service` - Business logic layer
  * `/repository` - Data access layer
  * `/model/entity` - JPA entities
  * `/model/dto` - Data transfer objects
  * `/security` - Security configuration
  * `/config` - Application configurations
  * `/exception` - Custom exceptions and handlers
  * `/util` - Utility classes
- `/src/main/resources` - Configuration files and SQL scripts

- Detailed file-by-file documentation including:
  * Purpose of each file
  * How to modify/extend functionality
  * Code examples for common modifications
  * Dependencies and relationships
- Architecture decisions and rationale
- Database schema with ER diagram
- Complete API endpoints documentation with examples
- Authentication/Authorization flow diagrams
- State management explanation (NgRx store structure)
- Component/Module documentation
- SASS/Bootstrap styling and theming guide
- Third-party integrations setup
- Field service specific workflows
- Troubleshooting common issues
- Performance optimization notes
- Security implementation details
- Future enhancement suggestions

#### API_DOCUMENTATION.md (API Reference)
- Base URL and versioning
- Authentication method
- Request/response formats
- All endpoints grouped by resource:
  * Endpoint URL
  * HTTP method
  * Description
  * Request parameters
  * Request body (with examples)
  * Response format (with examples)
  * Status codes
  * Error responses
- Authentication endpoints
- Field service management endpoints
- User management endpoints
- Dashboard/analytics endpoints
- Rate limiting information
- API usage examples with cURL and Angular HTTP client

### 9. Additional Requirements

#### Configuration Files
- `.gitignore` for both frontend and backend
- `package.json` with all Angular dependencies
- `angular.json` configuration
- `tsconfig.json` TypeScript configuration
- `pom.xml` with all Maven dependencies
- `application.properties` / `application.yml`
- `application-dev.properties` (development)
- `application-prod.properties` (production)
- `.env.example` for frontend environment variables

#### DevOps & Deployment
- Dockerfile for both frontend and backend
- `docker-compose.yml` for full stack deployment
- CI/CD pipeline configuration:
  * GitHub Actions / GitLab CI / Jenkins
  * Automated testing
  * Build and deployment
- Nginx configuration for frontend serving
- MySQL initialization scripts

#### Testing Setup
- **Frontend:**
  * Jasmine/Karma configuration
  * Unit test examples for components and services
  * E2E tests with Protractor or Cypress
- **Backend:**
  * JUnit 5 test setup
  * Mockito for mocking
  * Integration tests with TestContainers
  * Spring Boot Test configuration
- Test coverage reports configuration

#### Code Quality Tools
- **Frontend:**
  * ESLint configuration
  * Prettier configuration
  * TSLint (if applicable)
  * Husky for pre-commit hooks
- **Backend:**
  * Checkstyle configuration
  * SpotBugs/PMD configuration
  * SonarQube integration
- EditorConfig for consistent coding styles

### 10. Field Services Specific Features

Implement the following domain-specific features:
- Service request creation and management
- Technician assignment and scheduling
- Work order tracking
- Customer management
- Service history and reports
- Real-time status updates
- Mobile-responsive interface for field technicians
- Dashboard with KPIs and analytics
- Notifications system
- Document/image upload for service reports
- Search and filter capabilities
- Audit trail for all operations

### 11. Deliverables Checklist
- [ ] Complete Angular frontend with Bootstrap UI
- [ ] Spring Boot backend with RESTful APIs
- [ ] MySQL database with schema and sample data
- [ ] All features implemented and working
- [ ] Clean, commented, and formatted code
- [ ] README.md with comprehensive overview
- [ ] DEVELOPER_GUIDE.md with technical details
- [ ] API_DOCUMENTATION.md with all endpoints
- [ ] Version documentation for all dependencies
- [ ] Security measures implemented
- [ ] Performance optimizations applied
- [ ] SEO optimizations implemented (Angular Universal)
- [ ] Testing setup completed
- [ ] All configuration files included
- [ ] Docker setup for containerization
- [ ] CI/CD pipeline configured
- [ ] Field service workflows implemented

## Output Format

Please provide:

1. **Project Structure Overview** (tree view for both frontend and backend)
2. **All Code Files** with full implementation:
   - Angular components, services, guards, interceptors
   - Spring Boot controllers, services, repositories, entities
   - SASS stylesheets with Bootstrap customization
   - Configuration files
3. **Database Schema** with SQL scripts
4. **All Three Documentation Files** (README.md, DEVELOPER_GUIDE.md, API_DOCUMENTATION.md)
5. **Version Manifest** - Complete list of all technologies with versions
6. **Architecture Summary** - Key architectural decisions and rationale
7. **Deployment Guide** - Step-by-step production deployment instructions

## Implementation Approach

Begin by:
1. Outlining the complete architecture
2. Defining the database schema
3. Creating the Spring Boot backend structure
4. Implementing the Angular frontend structure
5. Integrating Bootstrap and SASS
6. Implementing security features
7. Adding performance optimizations
8. Creating comprehensive documentation
9. Setting up testing and CI/CD

Please ensure all code follows best practices, is production-ready, and uses the latest stable versions of all technologies.


Create request:

Method: POST
URL: http://localhost:8081/api/v1/auth/login
Header: Content-Type = application/json
Body:
{
"usernameOrEmail": "admin",
"password": "Admin@1234"
}
Copy data.accessToken from response.

Call users endpoint:

Method: GET
URL: http://localhost:8081/api/v1/users
Authorization: Bearer Token
Token: paste accessToken
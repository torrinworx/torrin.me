# Apps

The `apps` folder contains individual backend servers that host REST APIs. These servers are designed to be deployed separately on servers and are then called by the main backend folder. The data and functionality provided by these backend servers are subsequently displayed on the frontend.

## Purpose

The purpose of the `apps` folder is to house independent backend projects written in Python, Express, or any other technology as required. Each backend server serves a specific purpose and exposes a REST API to handle specific functionality or data access.

## Folder Structure

The `apps` folder follows a modular structure, where each backend project resides in its own subfolder. The subfolders contain the code, configuration files, and any other resources required for that particular backend server.

## Deployment

To deploy an individual backend server, follow the deployment instructions specific to that project. Each backend server may have its own requirements, such as environment variables, database connections, or external service integrations.

Once deployed, the main backend server (located outside the `apps` folder) can communicate with these individual backend servers through their respective REST APIs.

## Integration with Frontend

The APIs provided by the individual backend servers in the `apps` folder are used by the frontend to fetch data, perform actions, or access specific functionality. The frontend makes HTTP requests to these backend servers and receives the necessary data or performs the required operations.

When developing the frontend, ensure that the API endpoints and any required authentication or authorization mechanisms are properly configured to interact with the backend servers in the `apps` folder.


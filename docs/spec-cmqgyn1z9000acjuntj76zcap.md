# Chat Application Architecture
## Overview
The chat application is designed to facilitate real-time communication between users in a chat room, specifically aiming to support up to 100 users concurrently. The architecture is centered around an API Gateway for handling user requests, a Message Service for processing and storing messages, a database for persistence, and a WebSocket Service for real-time communications. The design incorporates horizontal scaling and sharding to ensure scalability and performance.

## Components
### Users
- **Role**: End-users of the chat application.
- **Responsibility**: Users send messages and interact with the chat room via the API Gateway.
- **Interfaces**: Clients communicate with the system by sending requests to the API Gateway.

### API Gateway
- **Role**: Entry point for user requests.
- **Responsibilities**: It forwards user messages to the appropriate services, manages client sessions, and handles WebSocket connections.
- **Interfaces**: Receives messages from users and forwards requests to the Message Service, WebSocket Service, and delivers messages from the Message Queue.

### Message Service
- **Role**: Core service responsible for processing messages.
- **Responsibilities**: Stores messages in the Database and interacts with the Message Queue for message delivery.
- **Interfaces**: Accepts forwarded requests from the API Gateway, stores messages to the Database, and processes messages to the Message Queue.

### Database
- **Role**: Persistent storage for chat messages.
- **Responsibilities**: Stores and retrieves messages as needed by the Message Service.
- **Interfaces**: Interacts with the Message Service to store and query messages; influenced by sharding for data partitioning.

### Message Queue
- **Role**: Asynchronous message-handling component.
- **Responsibilities**: Processes messages from the Message Service for delivery to the API Gateway and facilitates communication between the WebSocket Service and the Message Service.
- **Interfaces**: Accepts messages from the Message Service and delivers them to the API Gateway; receives messages from the WebSocket Service.

### WebSocket Service
- **Role**: Manages real-time communication for chat messages.
- **Responsibilities**: Facilitates WebSocket connections to users, ensuring messages are delivered in real-time.
- **Interfaces**: Connects to the API Gateway to receive connections and forwards messages to the Message Queue for processing.

### Horizontal Scaling
- **Role**: Scalability strategy for the Message Service.
- **Description**: Allows the Message Service to scale out by deploying multiple instances to handle increased loads, especially when approaching the user limit in a chat room.

### Sharding
- **Role**: Data partitioning strategy for the Database.
- **Description**: Partitions data across multiple database instances to improve performance and manageability, particularly valuable as the number of users and messages grows.

## Data Flow & Interactions
1. **Users** send messages to the **API Gateway**.
2. The **API Gateway** forwards the requests to the **Message Service**.
3. The **Message Service** stores messages in the **Database**.
4. The **Message Service** processes messages and pushes them to the **Message Queue**.
5. The **Message Queue** delivers messages back to the **API Gateway**.
6. The **API Gateway** connects to the **WebSocket Service** to facilitate real-time communication.
7. The **WebSocket Service** sends messages to the **Message Queue** for processing and delivery to users.

## Design Notes
- The architecture has been designed for scalability to handle a chat room of up to 100 users simultaneously through horizontal scaling and sharding strategies.
- Horizontal scaling will ensure that the Message Service can handle increased loads by deploying new instances as needed without significant architectural changes.
- Sharding the Database will enhance performance by distributing user messages across multiple data stores, thus improving read and write operations.
- The use of WebSocket provides real-time capability and minimizes latency in message delivery, making the chat experience more engaging.
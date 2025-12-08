# API Documentation

Base URL: `http://localhost:3001/api`

## Authentication

### Register
```
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

### Login
```
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "user": { ... },
  "access_token": "jwt_token"
}
```

### Get Profile
```
GET /auth/me
Authorization: Bearer {token}
```

## Companies

### Create Company Profile
```
POST /companies
Authorization: Bearer {token}

{
  "name": "My Company s.r.o.",
  "ico": "12345678",
  "dic": "CZ12345678",
  "isVatPayer": true,
  "street": "Main Street 123",
  "city": "Prague",
  "postalCode": "11000",
  "phone": "+420123456789",
  "email": "info@company.com"
}
```

### Get My Company
```
GET /companies/me
Authorization: Bearer {token}
```

### Update Company
```
PATCH /companies/me
Authorization: Bearer {token}

{
  "phone": "+420987654321"
}
```

## Clients

### Create Client
```
POST /clients
Authorization: Bearer {token}

{
  "type": "customer",
  "name": "Client Name",
  "ico": "87654321",
  "email": "client@example.com",
  "defaultDuedays": 30
}
```

### List Clients
```
GET /clients?type=customer&search=name
Authorization: Bearer {token}
```

### Get Client
```
GET /clients/:id
Authorization: Bearer {token}
```

### Get Client History
```
GET /clients/:id/history
Authorization: Bearer {token}
```

## Products

### Create Product
```
POST /products
Authorization: Bearer {token}

{
  "name": "Product Name",
  "description": "Product description",
  "unit": "ks",
  "price": 1000,
  "vatRate": 21,
  "isService": false
}
```

### List Products
```
GET /products?search=name&isService=false
Authorization: Bearer {token}
```

## Invoices

### Create Invoice
```
POST /invoices
Authorization: Bearer {token}

{
  "type": "standard",
  "clientId": "client_id",
  "dueDate": "2024-12-31",
  "items": [
    {
      "description": "Product/Service",
      "quantity": 1,
      "unit": "ks",
      "unitPrice": 1000,
      "vatRate": 21,
      "discount": 0
    }
  ]
}
```

### List Invoices
```
GET /invoices?status=unpaid&clientId=xxx
Authorization: Bearer {token}
```

### Get Invoice
```
GET /invoices/:id
Authorization: Bearer {token}
```

### Get Invoice Statistics
```
GET /invoices/stats
Authorization: Bearer {token}
```

### Update Invoice
```
PATCH /invoices/:id
Authorization: Bearer {token}

{
  "status": "paid"
}
```

## Offers

### Create Offer
```
POST /offers
Authorization: Bearer {token}

{
  "clientId": "client_id",
  "validUntil": "2024-12-31",
  "items": [
    {
      "description": "Product/Service",
      "quantity": 1,
      "unit": "ks",
      "unitPrice": 1000,
      "vatRate": 21
    }
  ]
}
```

### List Offers
```
GET /offers?status=sent
Authorization: Bearer {token}
```

## Orders

### Create Order
```
POST /orders
Authorization: Bearer {token}

{
  "clientId": "client_id",
  "name": "Order Name",
  "totalAmount": 12100
}
```

### Convert Offer to Order
```
POST /orders/from-offer/:offerId
Authorization: Bearer {token}
```

### List Orders
```
GET /orders?status=new
Authorization: Bearer {token}
```

### Add Timeline Event
```
POST /orders/:id/timeline
Authorization: Bearer {token}

{
  "event": "approved",
  "description": "Order approved by client"
}
```

## Dashboard

### Get Overview
```
GET /dashboard/overview
Authorization: Bearer {token}

Response:
{
  "invoices": {
    "total": 100,
    "paid": 60,
    "unpaid": 40,
    "overdue": 5
  },
  "revenue": {
    "total": 1000000,
    "paid": 600000,
    "unpaid": 400000
  },
  "stats": {
    "clients": 50,
    "products": 20,
    "offers": 30,
    "orders": 25
  }
}
```

### Get Monthly Revenue
```
GET /dashboard/revenue/monthly?year=2024
Authorization: Bearer {token}
```

### Get Top Clients
```
GET /dashboard/clients/top?limit=10
Authorization: Bearer {token}
```

### Get Overdue Invoices
```
GET /dashboard/invoices/overdue
Authorization: Bearer {token}
```

### Get Recent Activity
```
GET /dashboard/activity/recent?limit=10
Authorization: Bearer {token}
```

## Integrations

### Get Company Info from ARES
```
GET /integrations/ares/company/:ico
Authorization: Bearer {token}

Response:
{
  "ico": "12345678",
  "name": "Company Name s.r.o.",
  "dic": "CZ12345678",
  "isVatPayer": true,
  "street": "Main Street 123",
  "city": "Prague",
  "postalCode": "11000",
  "country": "CZ"
}
```

### Validate IČO
```
GET /integrations/ares/validate/:ico
Authorization: Bearer {token}

Response:
{
  "ico": "12345678",
  "isValid": true
}
```

## Error Responses

All endpoints return standard error responses:

```json
{
  "statusCode": 400,
  "message": "Error message",
  "error": "Bad Request"
}
```

Common status codes:
- 400: Bad Request
- 401: Unauthorized
- 404: Not Found
- 409: Conflict
- 500: Internal Server Error

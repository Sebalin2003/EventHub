# ZAP Scanning Report

ZAP by [Checkmarx](https://checkmarx.com/).


## Summary of Alerts

| Risk Level | Number of Alerts |
| --- | --- |
| High | 0 |
| Medium | 0 |
| Low | 0 |
| Informational | 3 |




## Insights

| Level | Reason | Site | Description | Statistic |
| --- | --- | --- | --- | --- |
| Medium | Exceeded High | http://host.docker.internal:3001 | Percentage of responses with status code 4xx | 99 % |
| Info | Informational | http://host.docker.internal:3001 | Percentage of responses with status code 2xx | 1 % |
| Info | Informational | http://host.docker.internal:3001 | Percentage of endpoints with content type application/json | 6 % |
| Info | Informational | http://host.docker.internal:3001 | Percentage of endpoints with content type application/problem+json | 93 % |
| Info | Informational | http://host.docker.internal:3001 | Percentage of endpoints with method DELETE | 4 % |
| Info | Informational | http://host.docker.internal:3001 | Percentage of endpoints with method GET | 57 % |
| Info | Informational | http://host.docker.internal:3001 | Percentage of endpoints with method PATCH | 9 % |
| Info | Informational | http://host.docker.internal:3001 | Percentage of endpoints with method POST | 25 % |
| Info | Informational | http://host.docker.internal:3001 | Percentage of endpoints with method PUT | 3 % |
| Info | Informational | http://host.docker.internal:3001 | Count of total endpoints | 126    |







## Alerts

| Name | Risk Level | Number of Instances |
| --- | --- | --- |
| A Client Error response code was returned by the server | Informational | 123 |
| Authentication Request Identified | Informational | 1 |
| Non-Storable Content | Informational | Systemic |




## Alert Detail



### [ A Client Error response code was returned by the server ](https://www.zaproxy.org/docs/alerts/100000/)



##### Informational (High)

### Description

A response code of 400 was returned by the server.
This may indicate that the application is failing to handle unexpected input correctly.
Raised by the 'Alert on HTTP Response Code Error' script

* URL: http://host.docker.internal:3001/events/id
  * Node Name: `http://host.docker.internal:3001/events/id`
  * Method: `DELETE`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3001/events/id/
  * Node Name: `http://host.docker.internal:3001/events/id/`
  * Method: `DELETE`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3001/inventory/eventId/holds/holdId
  * Node Name: `http://host.docker.internal:3001/inventory/eventId/holds/holdId`
  * Method: `DELETE`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3001/inventory/eventId/holds/holdId/
  * Node Name: `http://host.docker.internal:3001/inventory/eventId/holds/holdId/`
  * Method: `DELETE`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3001/me/favorites/eventId
  * Node Name: `http://host.docker.internal:3001/me/favorites/eventId`
  * Method: `DELETE`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3001/me/favorites/eventId/
  * Node Name: `http://host.docker.internal:3001/me/favorites/eventId/`
  * Method: `DELETE`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3001/6716215854053471158
  * Node Name: `http://host.docker.internal:3001/6716215854053471158`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3001/actuator/health
  * Node Name: `http://host.docker.internal:3001/actuator/health`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3001/ai
  * Node Name: `http://host.docker.internal:3001/ai`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3001/ai/
  * Node Name: `http://host.docker.internal:3001/ai/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3001/ai/7111904817067593197
  * Node Name: `http://host.docker.internal:3001/ai/7111904817067593197`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3001/auth
  * Node Name: `http://host.docker.internal:3001/auth`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3001/auth/
  * Node Name: `http://host.docker.internal:3001/auth/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3001/auth/3626925890723386353
  * Node Name: `http://host.docker.internal:3001/auth/3626925890723386353`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3001/check-in
  * Node Name: `http://host.docker.internal:3001/check-in`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3001/check-in/
  * Node Name: `http://host.docker.internal:3001/check-in/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3001/check-in/8078691338906174182
  * Node Name: `http://host.docker.internal:3001/check-in/8078691338906174182`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3001/check-in/ticketId
  * Node Name: `http://host.docker.internal:3001/check-in/ticketId`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3001/check-in/ticketId/
  * Node Name: `http://host.docker.internal:3001/check-in/ticketId/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3001/check-in/ticketId/6960949884444219958
  * Node Name: `http://host.docker.internal:3001/check-in/ticketId/6960949884444219958`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3001/computeMetadata/v1/
  * Node Name: `http://host.docker.internal:3001/computeMetadata/v1/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3001/events/3737843376589657457
  * Node Name: `http://host.docker.internal:3001/events/3737843376589657457`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3001/events/id
  * Node Name: `http://host.docker.internal:3001/events/id`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3001/events/id/
  * Node Name: `http://host.docker.internal:3001/events/id/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3001/inventory
  * Node Name: `http://host.docker.internal:3001/inventory`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3001/inventory/
  * Node Name: `http://host.docker.internal:3001/inventory/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3001/inventory/1429107321680111693
  * Node Name: `http://host.docker.internal:3001/inventory/1429107321680111693`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3001/inventory/eventId
  * Node Name: `http://host.docker.internal:3001/inventory/eventId`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3001/inventory/eventId/
  * Node Name: `http://host.docker.internal:3001/inventory/eventId/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3001/inventory/eventId/9157263829810994370
  * Node Name: `http://host.docker.internal:3001/inventory/eventId/9157263829810994370`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3001/inventory/eventId/holds
  * Node Name: `http://host.docker.internal:3001/inventory/eventId/holds`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3001/inventory/eventId/holds/
  * Node Name: `http://host.docker.internal:3001/inventory/eventId/holds/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3001/inventory/eventId/holds/4047144843908184395
  * Node Name: `http://host.docker.internal:3001/inventory/eventId/holds/4047144843908184395`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3001/inventory/eventId/holds/holdId
  * Node Name: `http://host.docker.internal:3001/inventory/eventId/holds/holdId`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3001/inventory/eventId/holds/holdId/
  * Node Name: `http://host.docker.internal:3001/inventory/eventId/holds/holdId/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3001/inventory/eventId/holds/holdId/4848543272703731645
  * Node Name: `http://host.docker.internal:3001/inventory/eventId/holds/holdId/4848543272703731645`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3001/latest/meta-data/
  * Node Name: `http://host.docker.internal:3001/latest/meta-data/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3001/me
  * Node Name: `http://host.docker.internal:3001/me`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3001/me/
  * Node Name: `http://host.docker.internal:3001/me/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3001/me/3383816196949965324
  * Node Name: `http://host.docker.internal:3001/me/3383816196949965324`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3001/me/favorites/5593020942682891279
  * Node Name: `http://host.docker.internal:3001/me/favorites/5593020942682891279`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3001/metadata/instance
  * Node Name: `http://host.docker.internal:3001/metadata/instance`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3001/metadata/v1
  * Node Name: `http://host.docker.internal:3001/metadata/v1`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3001/opc/v1/instance/
  * Node Name: `http://host.docker.internal:3001/opc/v1/instance/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3001/opc/v2/instance/
  * Node Name: `http://host.docker.internal:3001/opc/v2/instance/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3001/openstack/latest/meta_data.json
  * Node Name: `http://host.docker.internal:3001/openstack/latest/meta_data.json`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3001/orders/1478137892355687297
  * Node Name: `http://host.docker.internal:3001/orders/1478137892355687297`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://host.docker.internal:3001/orders/id
  * Node Name: `http://host.docker.internal:3001/orders/id`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://host.docker.internal:3001/orders/id/
  * Node Name: `http://host.docker.internal:3001/orders/id/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://host.docker.internal:3001/orders/id/8263394460945229829
  * Node Name: `http://host.docker.internal:3001/orders/id/8263394460945229829`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3001/organizer
  * Node Name: `http://host.docker.internal:3001/organizer`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3001/organizer/
  * Node Name: `http://host.docker.internal:3001/organizer/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3001/organizer/9094562994989838209
  * Node Name: `http://host.docker.internal:3001/organizer/9094562994989838209`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3001/organizer/events
  * Node Name: `http://host.docker.internal:3001/organizer/events`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:3001/organizer/events/
  * Node Name: `http://host.docker.internal:3001/organizer/events/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:3001/organizer/events/3827969495885721700
  * Node Name: `http://host.docker.internal:3001/organizer/events/3827969495885721700`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3001/organizer/events/eventId
  * Node Name: `http://host.docker.internal:3001/organizer/events/eventId`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3001/organizer/events/eventId/
  * Node Name: `http://host.docker.internal:3001/organizer/events/eventId/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3001/organizer/events/eventId/630060115069563913
  * Node Name: `http://host.docker.internal:3001/organizer/events/eventId/630060115069563913`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3001/payments
  * Node Name: `http://host.docker.internal:3001/payments`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3001/payments/
  * Node Name: `http://host.docker.internal:3001/payments/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3001/payments/4762021720986230386
  * Node Name: `http://host.docker.internal:3001/payments/4762021720986230386`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3001/tickets
  * Node Name: `http://host.docker.internal:3001/tickets`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3001/tickets/
  * Node Name: `http://host.docker.internal:3001/tickets/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3001/tickets/3758508466222466354
  * Node Name: `http://host.docker.internal:3001/tickets/3758508466222466354`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3001/tickets/id
  * Node Name: `http://host.docker.internal:3001/tickets/id`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3001/tickets/id/
  * Node Name: `http://host.docker.internal:3001/tickets/id/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3001/tickets/id/1832846217077495535
  * Node Name: `http://host.docker.internal:3001/tickets/id/1832846217077495535`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3001/tickets/user
  * Node Name: `http://host.docker.internal:3001/tickets/user`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3001/tickets/user/
  * Node Name: `http://host.docker.internal:3001/tickets/user/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3001/events/id
  * Node Name: `http://host.docker.internal:3001/events/id ()({title,description,date,endDate,location,duration,ticketTypes:[{id,eventId,name,description,price,totalQuantity,sold,status}]})`
  * Method: `PATCH`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://host.docker.internal:3001/events/id/
  * Node Name: `http://host.docker.internal:3001/events/id/ ()({title,description,date,endDate,location,duration,ticketTypes:[{id,eventId,name,description,price,totalQuantity,sold,status}]})`
  * Method: `PATCH`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://host.docker.internal:3001/orders/id/cancel
  * Node Name: `http://host.docker.internal:3001/orders/id/cancel`
  * Method: `PATCH`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://host.docker.internal:3001/orders/id/cancel/
  * Node Name: `http://host.docker.internal:3001/orders/id/cancel/`
  * Method: `PATCH`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://host.docker.internal:3001/orders/id/pay
  * Node Name: `http://host.docker.internal:3001/orders/id/pay`
  * Method: `PATCH`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://host.docker.internal:3001/orders/id/pay/
  * Node Name: `http://host.docker.internal:3001/orders/id/pay/`
  * Method: `PATCH`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://host.docker.internal:3001/orders/id/refund
  * Node Name: `http://host.docker.internal:3001/orders/id/refund`
  * Method: `PATCH`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://host.docker.internal:3001/orders/id/refund/
  * Node Name: `http://host.docker.internal:3001/orders/id/refund/`
  * Method: `PATCH`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://host.docker.internal:3001/organizer/events/eventId
  * Node Name: `http://host.docker.internal:3001/organizer/events/eventId ()({title,description,date,endDate,location,duration,ticketTypes:[{id,eventId,name,description,price,totalQuantity,sold,status}]})`
  * Method: `PATCH`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:3001/organizer/events/eventId/
  * Node Name: `http://host.docker.internal:3001/organizer/events/eventId/ ()({title,description,date,endDate,location,duration,ticketTypes:[{id,eventId,name,description,price,totalQuantity,sold,status}]})`
  * Method: `PATCH`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:3001/tickets/id/cancel
  * Node Name: `http://host.docker.internal:3001/tickets/id/cancel`
  * Method: `PATCH`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3001/tickets/id/cancel/
  * Node Name: `http://host.docker.internal:3001/tickets/id/cancel/`
  * Method: `PATCH`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3001/ai/advisor
  * Node Name: `http://host.docker.internal:3001/ai/advisor ()({query,budget,city})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://host.docker.internal:3001/ai/advisor/
  * Node Name: `http://host.docker.internal:3001/ai/advisor/ ()({query,budget,city})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://host.docker.internal:3001/auth/login
  * Node Name: `http://host.docker.internal:3001/auth/login ()({email,password})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://host.docker.internal:3001/auth/login
  * Node Name: `http://host.docker.internal:3001/auth/login ()({email,password})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:3001/auth/login
  * Node Name: `http://host.docker.internal:3001/auth/login ()({email,password})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://host.docker.internal:3001/auth/login/
  * Node Name: `http://host.docker.internal:3001/auth/login/ ()({email,password})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://host.docker.internal:3001/auth/register
  * Node Name: `http://host.docker.internal:3001/auth/register ()({email,password,firstName,lastName})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://host.docker.internal:3001/auth/register
  * Node Name: `http://host.docker.internal:3001/auth/register ()({email,password,firstName,lastName})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `409`
  * Other Info: ``
* URL: http://host.docker.internal:3001/auth/register/
  * Node Name: `http://host.docker.internal:3001/auth/register/ ()({email,password,firstName,lastName})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://host.docker.internal:3001/check-in/ticketId/scan
  * Node Name: `http://host.docker.internal:3001/check-in/ticketId/scan ()({eventId})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3001/check-in/ticketId/scan/
  * Node Name: `http://host.docker.internal:3001/check-in/ticketId/scan/ ()({eventId})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3001/events
  * Node Name: `http://host.docker.internal:3001/events ()({title,description,category,modality,date,endDate,venue,location,city,capacity,ticketTypes:[{id,eventId,name,description,price,totalQuantity,sold,status}]})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://host.docker.internal:3001/events/
  * Node Name: `http://host.docker.internal:3001/events/ ()({title,description,category,modality,date,endDate,venue,location,city,capacity,ticketTypes:[{id,eventId,name,description,price,totalQuantity,sold,status}]})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://host.docker.internal:3001/inventory/eventId/holds
  * Node Name: `http://host.docker.internal:3001/inventory/eventId/holds ()({quantity,ttlMs})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://host.docker.internal:3001/inventory/eventId/holds/
  * Node Name: `http://host.docker.internal:3001/inventory/eventId/holds/ ()({quantity,ttlMs})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://host.docker.internal:3001/inventory/eventId/holds/holdId/commit
  * Node Name: `http://host.docker.internal:3001/inventory/eventId/holds/holdId/commit`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3001/inventory/eventId/holds/holdId/commit/
  * Node Name: `http://host.docker.internal:3001/inventory/eventId/holds/holdId/commit/`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3001/orders
  * Node Name: `http://host.docker.internal:3001/orders ()({items:[{eventId,ticketType,quantity,unitPrice}]})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://host.docker.internal:3001/orders
  * Node Name: `http://host.docker.internal:3001/orders ()({items:[{eventId,ticketType,quantity,unitPrice}]})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3001/orders/
  * Node Name: `http://host.docker.internal:3001/orders/ ()({items:[{eventId,ticketType,quantity,unitPrice}]})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3001/orders/id/cancel
  * Node Name: `http://host.docker.internal:3001/orders/id/cancel`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://host.docker.internal:3001/orders/id/cancel/
  * Node Name: `http://host.docker.internal:3001/orders/id/cancel/`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://host.docker.internal:3001/orders/id/pay
  * Node Name: `http://host.docker.internal:3001/orders/id/pay ()({card})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://host.docker.internal:3001/orders/id/pay/
  * Node Name: `http://host.docker.internal:3001/orders/id/pay/ ()({card})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://host.docker.internal:3001/organizer/events
  * Node Name: `http://host.docker.internal:3001/organizer/events ()({title,description,category,modality,date,endDate,venue,location,city,capacity,ticketTypes:[{id,eventId,name,description,price,totalQuantity,sold,status}]})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:3001/organizer/events/
  * Node Name: `http://host.docker.internal:3001/organizer/events/ ()({title,description,category,modality,date,endDate,venue,location,city,capacity,ticketTypes:[{id,eventId,name,description,price,totalQuantity,sold,status}]})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:3001/organizer/events/eventId/cancel
  * Node Name: `http://host.docker.internal:3001/organizer/events/eventId/cancel`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:3001/organizer/events/eventId/cancel/
  * Node Name: `http://host.docker.internal:3001/organizer/events/eventId/cancel/`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:3001/organizer/events/eventId/publish
  * Node Name: `http://host.docker.internal:3001/organizer/events/eventId/publish`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:3001/organizer/events/eventId/publish/
  * Node Name: `http://host.docker.internal:3001/organizer/events/eventId/publish/`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:3001/payments
  * Node Name: `http://host.docker.internal:3001/payments ()({amount,card})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://host.docker.internal:3001/payments/
  * Node Name: `http://host.docker.internal:3001/payments/ ()({amount,card})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://host.docker.internal:3001/payments/process
  * Node Name: `http://host.docker.internal:3001/payments/process ()({orderId,amount,cardNumber,cardHolder,simulateTimeout})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://host.docker.internal:3001/payments/process/
  * Node Name: `http://host.docker.internal:3001/payments/process/ ()({orderId,amount,cardNumber,cardHolder,simulateTimeout})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://host.docker.internal:3001/tickets
  * Node Name: `http://host.docker.internal:3001/tickets ()({orderId,eventId,userId,quantity})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://host.docker.internal:3001/tickets/
  * Node Name: `http://host.docker.internal:3001/tickets/ ()({orderId,eventId,userId,quantity})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://host.docker.internal:3001/inventory/eventId
  * Node Name: `http://host.docker.internal:3001/inventory/eventId ()({available})`
  * Method: `PUT`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://host.docker.internal:3001/inventory/eventId
  * Node Name: `http://host.docker.internal:3001/inventory/eventId ()({available})`
  * Method: `PUT`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3001/inventory/eventId/
  * Node Name: `http://host.docker.internal:3001/inventory/eventId/ ()({available})`
  * Method: `PUT`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3001/me/favorites/eventId
  * Node Name: `http://host.docker.internal:3001/me/favorites/eventId`
  * Method: `PUT`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3001/me/favorites/eventId/
  * Node Name: `http://host.docker.internal:3001/me/favorites/eventId/`
  * Method: `PUT`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``


Instances: 123

### Solution



### Reference



#### CWE Id: [ 388 ](https://cwe.mitre.org/data/definitions/388.html)


#### WASC Id: 20

#### Source ID: 4

### [ Authentication Request Identified ](https://www.zaproxy.org/docs/alerts/10111/)



##### Informational (High)

### Description

The given request has been identified as an authentication request. The 'Other Info' field contains a set of key=value lines which identify any relevant fields. If the request is in a context which has an Authentication Method set to "Auto-Detect" then this rule will change the authentication to match the request identified.

* URL: http://host.docker.internal:3001/auth/login
  * Node Name: `http://host.docker.internal:3001/auth/login ()({email,password})`
  * Method: `POST`
  * Parameter: `email`
  * Attack: ``
  * Evidence: `password`
  * Other Info: `userParam=email
userValue=zaproxy@example.com
passwordParam=password`


Instances: 1

### Solution

This is an informational alert rather than a vulnerability and so there is nothing to fix.

### Reference


* [ https://www.zaproxy.org/docs/desktop/addons/authentication-helper/auth-req-id/ ](https://www.zaproxy.org/docs/desktop/addons/authentication-helper/auth-req-id/)



#### Source ID: 3

### [ Non-Storable Content ](https://www.zaproxy.org/docs/alerts/10049/)



##### Informational (Medium)

### Description

The response contents are not storable by caching components such as proxy servers. If the response does not contain sensitive, personal or user-specific information, it may benefit from being stored and cached, to improve performance.

* URL: http://host.docker.internal:3001/
  * Node Name: `http://host.docker.internal:3001/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `no-store`
  * Other Info: ``
* URL: http://host.docker.internal:3001/events/id
  * Node Name: `http://host.docker.internal:3001/events/id`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `authorization:`
  * Other Info: ``
* URL: http://host.docker.internal:3001/auth/login
  * Node Name: `http://host.docker.internal:3001/auth/login ()({email,password})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `authorization:`
  * Other Info: ``
* URL: http://host.docker.internal:3001/auth/register
  * Node Name: `http://host.docker.internal:3001/auth/register ()({email,password,firstName,lastName})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `authorization:`
  * Other Info: ``
* URL: http://host.docker.internal:3001/events
  * Node Name: `http://host.docker.internal:3001/events ()({title,description,category,modality,date,endDate,venue,location,city,capacity,ticketTypes:[{id,eventId,name,description,price,totalQuantity,sold,status}]})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `authorization:`
  * Other Info: ``

Instances: Systemic


### Solution

The content may be marked as storable by ensuring that the following conditions are satisfied:
The request method must be understood by the cache and defined as being cacheable ("GET", "HEAD", and "POST" are currently defined as cacheable)
The response status code must be understood by the cache (one of the 1XX, 2XX, 3XX, 4XX, or 5XX response classes are generally understood)
The "no-store" cache directive must not appear in the request or response header fields
For caching by "shared" caches such as "proxy" caches, the "private" response directive must not appear in the response
For caching by "shared" caches such as "proxy" caches, the "Authorization" header field must not appear in the request, unless the response explicitly allows it (using one of the "must-revalidate", "public", or "s-maxage" Cache-Control response directives)
In addition to the conditions above, at least one of the following conditions must also be satisfied by the response:
It must contain an "Expires" header field
It must contain a "max-age" response directive
For "shared" caches such as "proxy" caches, it must contain a "s-maxage" response directive
It must contain a "Cache Control Extension" that allows it to be cached
It must have a status code that is defined as cacheable by default (200, 203, 204, 206, 300, 301, 404, 405, 410, 414, 501).

### Reference


* [ https://datatracker.ietf.org/doc/html/rfc7234 ](https://datatracker.ietf.org/doc/html/rfc7234)
* [ https://datatracker.ietf.org/doc/html/rfc7231 ](https://datatracker.ietf.org/doc/html/rfc7231)
* [ https://www.w3.org/Protocols/rfc2616/rfc2616-sec13.html ](https://www.w3.org/Protocols/rfc2616/rfc2616-sec13.html)


#### CWE Id: [ 524 ](https://cwe.mitre.org/data/definitions/524.html)


#### WASC Id: 13

#### Source ID: 3



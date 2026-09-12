# Project Coding Instructions

## General Rules

- Follow the existing project architecture and coding style.
- Before implementing a new feature, inspect similar existing implementations and follow their patterns.
- Do not introduce a new pattern, abstraction, or library unless explicitly requested.
- Do not refactor unrelated code.
- Keep implementations simple and consistent with the existing codebase.

## Controllers

- Controllers should be thin.
- Do not put business logic inside controllers.
- Controllers should delegate business operations to the appropriate service.
- Follow the existing controller naming, routing, response, and status-code conventions.

## Services

- Business logic belongs in the service layer.
- Follow the existing service implementation pattern.
- Reuse existing services, repositories, specifications, helpers, and utilities when applicable.
- Do not duplicate existing business logic.

## Repositories

- Follow the existing repository and Unit of Work patterns.
- Reuse existing repository methods when possible.
- Do not create a new repository or abstraction if an existing one can handle the requirement.

## DTOs

- Follow the existing Request/Response DTO structure.
- Do not expose domain entities directly from API endpoints.
- Follow the existing naming conventions for DTOs.

## Validation

- Follow the existing validation approach.
- Reuse existing validation mechanisms.
- Do not duplicate validation logic unnecessarily.

## Exceptions

- Use the existing custom exception types when applicable.
- Do not create a new exception type if an existing exception represents the same situation.
- Follow the existing global exception handling mechanism.

## Mapping

- Follow the existing mapping approach used by the project.
- Reuse existing mapping configurations when possible.
- Do not introduce a different mapping approach for a single feature.

## Naming

- Follow the existing naming conventions in the codebase.
- Use clear and descriptive names.
- Do not rename existing members unless explicitly requested.

## Database

- Follow the existing Entity Framework Core configuration and relationship patterns.
- Do not change existing database relationships unless explicitly required by the task.
- Reuse existing configurations and conventions.

## API Design

- Follow the existing API route naming conventions.
- Follow the existing HTTP verb and status-code conventions.
- Keep API responses consistent with the existing endpoints.

## Decision Making

- Do not choose an implementation pattern based only on general best practices when an established project pattern already exists.
- Project consistency takes priority over introducing a theoretically better pattern.

## Important

- Inspect similar existing code before implementing a new feature.
- Prefer consistency with the existing codebase over inventing a new solution.
- Do not over-engineer simple requirements.
- Do not add unnecessary abstractions.
- Do not modify unrelated files.
- If multiple valid approaches exist, prefer the approach already used in the project.
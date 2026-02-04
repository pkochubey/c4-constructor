# C4 Constructor

A visual constructor for C4 diagrams with Structurizr DSL export.

![main window](https://github.com/pkochubey/c4-constructor/blob/master/resources/image.png?raw=true)

## Features

- **Drag & Drop** - drag C4 elements onto the canvas
- **Relationships** - connect elements with relationship lines
- **Editing** - modify element properties in the right panel
- **Export DSL** - generate Structurizr DSL format
- **Save** - save to browser localStorage

## C4 Elements

- **Person** - system users
- **Software System** - software systems
- **Container** - containers (applications, databases)
- **Component** - components inside containers

## Installation & Running

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Usage

1. **Add elements**: Drag an element from the left panel onto the canvas
2. **Create relationships**: Drag from a connection point on one element to another
3. **Edit**: Click on an element and modify properties in the right panel
4. **Hierarchy**: For Containers, select the parent Software System
5. **Export**: Click "Export DSL" to download the file

## Structurizr DSL

The application generates valid [Structurizr DSL](https://docs.structurizr.com/dsl/language) which can be used with:

- [Structurizr Lite](https://structurizr.com/help/lite)
- [Structurizr Cloud](https://structurizr.com/)
- [Structurizr CLI](https://github.com/structurizr/cli)

### Example Generated DSL

```dsl
workspace "My System" "Description of my system" {

    model {
        user = person "User" "A user of the system"

        mySystem = softwareSystem "My System" "Main software system" {
            webApp = container "Web Application" "Frontend" "React"
            api = container "API" "Backend service" "Node.js"
            database = container "Database" "Data storage" "PostgreSQL"
        }

        user -> webApp "Uses"
        webApp -> api "Makes API calls" "HTTPS"
        api -> database "Reads/Writes" "SQL"
    }

    views {
        systemContext mySystem "SystemContext" {
            include *
            autoLayout
        }

        container mySystem "Containers" {
            include *
            autoLayout
        }

        styles {
            element "Person" {
                shape Person
                background #08427b
                color #ffffff
            }
            element "Software System" {
                background #1168bd
                color #ffffff
            }
        }
    }
}
```

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - type safety
- **React Flow** - graph visualization
- **Zustand** - state management
- **Vite** - build tool

## License

MIT

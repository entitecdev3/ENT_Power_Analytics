namespace portal.Power.Analytics;


context PowerBIPortal {

    entity Role {
        key RoleID    : UUID;
            RoleName  : String(100);
            CreatedAt : Timestamp @cds.on.insert: $now;
            UpdatedAt : Timestamp @cds.on.insert: $now;
    }

    entity Company {
        key CompanyID      : UUID;
            CompanyName    : String(255);
            ContactDetails : String(500);
            CreatedAt      : Timestamp @cds.on.insert: $now;
            UpdatedAt      : Timestamp @cds.on.insert: $now;
    }


    entity PowerBI {
        key id               : UUID;
        BIAccountUser    : String(100) not null @mandatory;
            authorityUrl     : String(255) default 'https://login.microsoftonline.com/';
            scopeBase        : String(255) default 'https://analysis.windows.net/powerbi/api/.default';
            powerBiApiUrl    : String(255) default 'https://api.powerbi.com/';
            clientId         : UUID not null @mandatory;
            clientSecret     : String(255) not null @mandatory;
            tenantId         : UUID not null @mandatory;
            reportsExposedId : Association to PowerBIPortal.ReportsExposed;
            CreatedAt        : Timestamp @cds.on.insert: $now;
            UpdatedAt        : Timestamp @cds.on.insert: $now;
    }

    entity Users {
        key UserID        : UUID;
            RoleID        : Association to PowerBIPortal.Role not null @mandatory;
            UserName      : String(150) not null @mandatory;
            CompanyID     : Association to PowerBIPortal.Company not null @mandatory;
            BIAccountUser : Association to PowerBIPortal.PowerBI;
            Password      : String(255) not null @mandatory @cds.password;
            CreatedAt     : Timestamp @cds.on.insert: $now;
            UpdatedAt     : Timestamp @cds.on.insert: $now;
    }

    entity Identity {
        key id        : UUID;
            username  : String(150);
            roles     : String(255);
            CreatedAt : Timestamp @cds.on.insert: $now;
            UpdatedAt : Timestamp @cds.on.insert: $now;
    }

    entity ReportsExposed {
        key id                   : UUID;
            reportId             : UUID not null @mandatory;
            workspaceId          : UUID not null @mandatory;
            reportComment        : String(500) not null @mandatory;
            workspaceComment     : String(500) not null @mandatory;
            securityFilterTypeId : Association to PowerBIPortal.SecurityFiltersType;
            CreatedAt            : Timestamp @cds.on.insert: $now;
            UpdatedAt            : Timestamp @cds.on.insert: $now;
    }

    entity SecurityFiltersType {
        key securityFilterTypeID : UUID;
            securityFilterType   : String(100) not null @mandatory;
            CreatedAt            : Timestamp @cds.on.insert: $now;
            UpdatedAt            : Timestamp @cds.on.insert: $now;
    }

    entity SecurityFilters {
        key securityId             : UUID;
            securityFilterTypeID   : Association to PowerBIPortal.SecurityFiltersType not null @mandatory;
            schema                 : String(100) not null @mandatory;
            displaySettingsID      : Association to PowerBIPortal.DisplaySettings not null @mandatory;
            operator               : String(50) not null @mandatory;
            requireSingleSelection : Boolean not null @mandatory;
            table                  : String(100) not null @mandatory;
            column                 : String(100) not null @mandatory;
            filterType             : String(50) not null @mandatory;
            values                 : String(500) not null @mandatory;
            CreatedAt              : Timestamp @cds.on.insert: $now;
            UpdatedAt              : Timestamp @cds.on.insert: $now;
    }

    entity DisplaySettings {
        key DisplaySettingsId : UUID;
            Property          : String(100);
            Value             : String(255);
            CreatedAt         : Timestamp @cds.on.insert: $now;
            UpdatedAt         : Timestamp @cds.on.insert: $now;
    }

    entity Configuration {
        key ConfigKey : String(100);
            Value     : String(255) not null @mandatory;
            CreatedAt : Timestamp @cds.on.insert: $now;
            UpdatedAt : Timestamp @cds.on.insert: $now;
    }
}

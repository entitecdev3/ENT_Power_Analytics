namespace portal.Power.Analytics;

context PowerBIPortal {

    entity Role {
        key RoleID    : UUID;
        RoleName      : String(100);
    }

    entity Company {
        key CompanyID     : UUID;
        CompanyName       : String(255);
        ContactDetails    : String(500);
    }

    entity PowerBI {
        key id            : UUID;
        BIAccountUser     : String(100);
        Password          : String(255) @cds.password;
        authorityUrl      : String(255);
        scopeBase         : String(255);
        powerBiApiUrl     : String(255);
        clientId          : String(100);
        clientSecret      : String(255);
        tenantId          : String(100);
        reportsExposedId  : Association to PowerBIPortal.ReportsExposed;
    }

    entity Users {
        key UserID       : UUID;
        RoleID           : Association to PowerBIPortal.Role;
        UserName         : String(150);
        CompanyID        : Association to PowerBIPortal.Company;
        BIAccountUser    : Association to PowerBIPortal.PowerBI;
        Password         : String(255) @cds.password;
    }    

    entity Identity {
        key id          : UUID;
        username        : String(150);
        roles           : String(255);
    }

    entity ReportsExposed {
        key id                    : UUID;
        reportId                  : String(100);
        workspaceId               : String(100);
        reportComment             : String(500);
        workspaceComment          : String(500);
        securityFilterTypeId      : Association to PowerBIPortal.SecurityFiltersType;
    }

    entity SecurityFiltersType {
        key securityFilterTypeID  : UUID;
        securityFilterType        : String(100);
    }

    entity SecurityFilters {
        key securityId            : UUID;
        securityFilterTypeID      : Association to PowerBIPortal.SecurityFiltersType;
        schema                    : String(100);
        displaySettingsID         : Association to PowerBIPortal.DisplaySettings;
        operator                  : String(50);
        requireSingleSelection    : Boolean;
        table                     : String(100);
        column                    : String(100);
        filterType                : String(50);
        values                    : String(500);
    }

    entity DisplaySettings {
        key DisplaySettingsId     : UUID;
        Property                  : String(100);
        Value                     : String(255);
    }

    entity Configuration {
        key ConfigKey   : String(100);
        Value           : String(255);
    }
}

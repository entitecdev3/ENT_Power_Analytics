namespace portal.Power.Analytics;
//using { sap.common } from '@sap/cds/common';

context PowerBIPortal {

    entity Role {
        key RoleID    : UUID;
        RoleName      : String;
    }

    entity Company {
        key CompanyID     : UUID;
        CompanyName       : String;
        ContactDetails    : String;
    }

    entity Users {
        key UserID       : UUID;
        RoleID           : Association to PowerBIPortal.Role;
        UserName         : String;
        CompanyID        : Association to PowerBIPortal.Company;
        BIAccountUser    : Boolean;
        Password         : String(255) @cds.password
    }

    entity PowerBI {
        key id            : UUID;
        BIAccountUser     : Association to PowerBIPortal.Users;
        Password          : String;
        authorityUrl      : String;
        scopeBase         : String;
        powerBiApiUrl     : String;
        clientId          : String;
        clientSecret      : String;
        tenantId          : String;
        reportsExposedId  : Association to PowerBIPortal.ReportsExposed;
    }

    entity Identity {
        key id          : UUID;
        username        : String;
        roles           : String;
    }

    entity ReportsExposed {
        key id                    : UUID;
        reportId                  : String;
        workspaceId               : String;
        reportComment             : String;
        workspaceComment          : String;
        securityFilterTypeId      : Association to PowerBIPortal.SecurityFiltersType;
    }

    entity SecurityFiltersType {
        key securityFilterTypeID  : UUID;
        securityFilterType        : String;
    }

    entity SecurityFilters {
        key securityId            : UUID;
        securityFilterTypeID      : Association to PowerBIPortal.SecurityFiltersType;
        schema                    : String;
        displaySettingsID         : Association to PowerBIPortal.DisplaySettings;
        operator                  : String;
        requireSingleSelection    : Boolean;
        table                     : String;
        column                    : String;
        filterType                : String;
        values                    : String;
    }

    entity DisplaySettings {
        key DisplaySettingsId     : UUID;
        IsLockedInViewMode        : Boolean;
    }

     entity Configuration {
        key ConfigKey   : String;
        Value           : String;
    }
}


// Configuration is outside the PowerBIPortal context since it is independent as per the table diagram provided
// context ConfigurationContext {
//     entity Configuration {
//         key ConfigKey   : String;
//         Value           : String;
//     }
// }

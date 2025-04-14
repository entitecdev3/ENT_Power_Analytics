namespace portal.Power.Analytics;

using { cuid, managed } from '@sap/cds/common';


context PowerBiPortal {
   @assert.unique : {
        username: [ username ]
    }
    entity Users: cuid, managed {
            username      : String(150) not null @mandatory;
            company       : Association to PowerBiPortal.Companies not null @mandatory;
            biUser : Association to PowerBiPortal.PowerBi;
            password      : String(255) not null @mandatory;
            roles         : Composition of many UserRoles on roles.user = $self;
    }

    entity Roles: cuid, managed {
            name  : String(100);
            users    : Association to many UserRoles on users.role = $self;
    }

    entity UserRoles: cuid, managed {
        user : Association to Users @key;
        role : Association to Roles @key;
    }

    entity Companies: cuid, managed  {
            name           : String(255);
            contactDetails : String(500);
            users: Association to many PowerBiPortal.Users on users.company = $self;
    }

    entity PowerBi: cuid, managed {
            biUser           : String(100) not null @mandatory;
            authorityUrl     : String(255) default 'https://login.microsoftonline.com/';
            scopeBase        : String(255) default 'https://analysis.windows.net/powerbi/api/.default';
            biApiUrl         : String(255) default 'https://api.powerbi.com/';
            clientId         : UUID not null @mandatory;
            clientSecret     : String(255) not null @mandatory;
            tenantId         : UUID not null @mandatory;
            reportExposed : Association to PowerBiPortal.ReportsExposed;
    }

    entity Identity: cuid, managed  {
            username  : String(150);
            roles     : String(255);
    }

    entity ReportsExposed: cuid, managed  {
            reportId             : UUID not null @mandatory;
            workspaceId          : UUID not null @mandatory;
            reportComment        : String(500) not null @mandatory;
            workspaceComment     : String(500) not null @mandatory;
            securityFilterType : Association to PowerBiPortal.SecurityFiltersType;
    }

    entity SecurityFiltersType: cuid, managed {
            name   : String(100) not null @mandatory;
    }

    entity SecurityFilters: cuid, managed {
            schema                 : String(100) not null @mandatory;
            operator               : String(50) not null @mandatory;
            requireSingleSelection : Boolean not null @mandatory;
            table                  : String(100) not null @mandatory;
            column                 : String(100) not null @mandatory;
            filterType             : String(50) not null @mandatory;
            values                 : String(500) not null @mandatory;
            securityFilterType     : Association to PowerBiPortal.SecurityFiltersType not null @mandatory;
            displaySetting        : Association to PowerBiPortal.DisplaySettings not null @mandatory;

    }

    entity DisplaySettings: cuid, managed  {
            property          : String(100);
            value             : String(255);
    }

    entity Configuration: cuid, managed  {
        key configKey : String(100);
            value     : String(255) not null @mandatory;
    }
}

namespace portal.Power.Analytics;

using {
        cuid,
        managed
} from '@sap/cds/common';


context PowerBiPortal {
        @assert.unique: {username: [username]}
        entity Users : cuid, managed {
                username : String(150) not null                            @mandatory;
                company  : Association to PowerBiPortal.Companies not null @mandatory;
                password : String(255) not null                            @mandatory;
                role     : Association to PowerBiPortal.Roles;
        }

        entity Roles : cuid, managed {
                name  : String(100);
                users : Association to many PowerBiPortal.Users
                                on users.role = $self;
                reports : Association to many ReportsToRoles on reports.role = $self;
        }

        entity Companies : cuid, managed {
                name           : String(255);
                contactDetails : String(500);
                users          : Association to many PowerBiPortal.Users
                                         on users.company = $self;
        }

        entity PowerBi : cuid, managed {
                biUser       : String(100) not null @mandatory;
                authorityUrl : String(255) default 'https://login.microsoftonline.com/';
                scopeBase    : String(255) default 'https://analysis.windows.net/powerbi/api/.default';
                biApiUrl     : String(255) default 'https://api.powerbi.com/';
                clientId     : UUID not null        @mandatory;
                clientSecret : String(255) not null @mandatory;
                tenantId     : UUID not null        @mandatory;
        }

        entity Identity : cuid, managed {
                username : String(150);
                roles    : String(255);
        }

        entity ReportsExposed : cuid, managed {
                        reportId         : UUID not null                                 @mandatory;
                        workspaceId      : UUID not null                                 @mandatory;
                        description      : String not null                               @mandatory;
                        externalRoles : String(500); 
                        servicePrincipal : Association to PowerBiPortal.PowerBi not null @mandatory;
                        securityFilters  : Composition of many ReportsToSecurityFilters
                                                   on securityFilters.report = $self;
                        roles            : Composition of many ReportsToRoles
                                                   on roles.report = $self;


                virtual reportName       : String;
                virtual workspaceName    : String;
                virtual reportUrl        : String;
                virtual workspaceUrl     : String;
        }

        entity SecurityFilters : cuid, managed {
                securityUniqueId                  : String(100) not null                                                    @mandatory;
                schema                            : String(100) default 'https://powerbi.com/product/schema#basic' not null @mandatory;
                operator                          : String(50) not null                                                     @mandatory;
                requireSingleSelection            : Boolean default false;
                table                             : String(100) not null                                                    @mandatory;
                column                            : String(100) not null                                                    @mandatory;
                values                            : String(500);
                displaySetting_isLockedInViewMode : Boolean default false;
                displaySetting_isHiddenInViewMode : Boolean default false;
                displaySetting_displayName        : String(100);
                reports                           : Association to many ReportsToSecurityFilters
                                                            on reports.filter = $self;
        }

        entity ReportsToSecurityFilters : cuid, managed {
                report : Association to ReportsExposed   @key  @mandatory;
                filter : Association to SecurityFilters  @key  @mandatory;
        }

        entity ReportsToRoles : cuid, managed {
                report : Association to ReportsExposed not null
                         @assert.notNull;
                role   : Association to Roles not null
                         @assert.notNull;
        }


        entity Configuration : cuid, managed {
                key configKey : String(100);
                    value     : String(255) not null @mandatory;
        }
}

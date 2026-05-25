// services

using portal.Power.Analytics.PowerBiPortal from '../db/schema';
using auth from './auth';

@requires: 'authenticated-user'
service MyService @(path: 'MyService') {

    entity Roles @cds.redirection.target as projection on PowerBiPortal.Roles {
        ID          as ID,
        name        as name,
        users       as users,
        reports     as reports,
        createdAt   as createdAt,
        createdBy   as createdBy,
        modifiedAt  as modifiedAt,
        modifiedBy  as modifiedBy
    };

    entity Companies as projection on PowerBiPortal.Companies {
        ID             as ID,
        name           as name,
        contactDetails as contactDetails,
        users          as users,
        createdAt      as createdAt,
        createdBy      as createdBy,
        modifiedAt     as modifiedAt,
        modifiedBy     as modifiedBy
    };

    entity MyReports as projection on PowerBiPortal.ReportsExposed {
        ID               as ID,
        portalType       as portalType,
        reportId         as reportId,
        workspaceId      as workspaceId,
        description      as description,
        externalRoles    as externalRoles,
        servicePrincipal as servicePrincipal,
        securityFilters  as securityFilters,
        roles            as roles,
        reportName       as reportName,
        workspaceName    as workspaceName,
        reportUrl        as reportUrl,
        workspaceUrl     as workspaceUrl,
        createdAt        as createdAt,
        createdBy        as createdBy,
        modifiedAt       as modifiedAt,
        modifiedBy       as modifiedBy
    };

    @(requires: ['Admin'])
    entity Users as projection on PowerBiPortal.Users {
        ID         as ID,
        username   as username,
        email      as email,
        company    as company,
        password   as password,
        role       as role,
        createdAt  as createdAt,
        createdBy  as createdBy,
        modifiedAt as modifiedAt,
        modifiedBy as modifiedBy
    };

    @(requires: ['Admin'])
    entity AssignableRoles as projection on PowerBiPortal.Roles {
        ID   as ID,
        name as name
    } where name != 'Admin';

    @(requires: ['Admin'])
    entity PowerBi as projection on PowerBiPortal.PowerBi {
        ID           as ID,
        biUser       as biUser,
        authorityUrl as authorityUrl,
        scopeBase    as scopeBase,
        biApiUrl     as biApiUrl,
        clientId     as clientId,
        clientSecret as clientSecret,
        tenantId     as tenantId,
        createdAt    as createdAt,
        createdBy    as createdBy,
        modifiedAt   as modifiedAt,
        modifiedBy   as modifiedBy
    };

    @(requires: ['Admin'])
    entity Identity as projection on PowerBiPortal.Identity {
        ID         as ID,
        username   as username,
        roles      as roles,
        createdAt  as createdAt,
        createdBy  as createdBy,
        modifiedAt as modifiedAt,
        modifiedBy as modifiedBy
    };

    @(requires: ['Admin'])
    entity SecurityFilters as projection on PowerBiPortal.SecurityFilters {
        ID                                as ID,
        securityUniqueId                  as securityUniqueId,
        portalType                        as portalType,
        description                       as description,
        schema                            as schema,
        operator                          as operator,
        requireSingleSelection            as requireSingleSelection,
        table                             as table,
        column                            as column,
        valueSource                       as valueSource,
        customValues                      as customValues,
        displaySetting_isLockedInViewMode as displaySetting_isLockedInViewMode,
        displaySetting_isHiddenInViewMode as displaySetting_isHiddenInViewMode,
        displaySetting_displayName        as displaySetting_displayName,
        reports                           as reports,
        createdAt                         as createdAt,
        createdBy                         as createdBy,
        modifiedAt                        as modifiedAt,
        modifiedBy                        as modifiedBy
    };

    @(requires: ['Admin'])
    entity Configuration as projection on PowerBiPortal.Configuration {
        ID         as ID,
        configKey  as configKey,
        value      as value,
        createdAt  as createdAt,
        createdBy  as createdBy,
        modifiedAt as modifiedAt,
        modifiedBy as modifiedBy
    };

    @(requires: ['Admin'])
    entity ReportsToSecurityFilters as projection on PowerBiPortal.ReportsToSecurityFilters {
        ID         as ID,
        report     as report,
        filter     as filter,
        createdAt  as createdAt,
        createdBy  as createdBy,
        modifiedAt as modifiedAt,
        modifiedBy as modifiedBy
    };

    @(requires: ['Admin'])
    entity ReportsToRoles as projection on PowerBiPortal.ReportsToRoles {
        ID         as ID,
        report     as report,
        role       as role,
        createdAt  as createdAt,
        createdBy  as createdBy,
        modifiedAt as modifiedAt,
        modifiedBy as modifiedBy
    };

    @(requires: ['Admin'])
    entity ReportsExposed @cds.redirection.target as projection on PowerBiPortal.ReportsExposed {
        ID               as ID,
        portalType       as portalType,
        reportId         as reportId,
        workspaceId      as workspaceId,
        description      as description,
        externalRoles    as externalRoles,
        servicePrincipal as servicePrincipal,
        securityFilters  as securityFilters,
        roles            as roles,
        reportName       as reportName,
        workspaceName    as workspaceName,
        reportUrl        as reportUrl,
        workspaceUrl     as workspaceUrl,
        createdAt        as createdAt,
        createdBy        as createdBy,
        modifiedAt       as modifiedAt,
        modifiedBy       as modifiedBy
    };

    function getCustomAttrbute() returns auth.CustomAttributes;
    function getUserInfo()       returns auth.UserInfo;
}

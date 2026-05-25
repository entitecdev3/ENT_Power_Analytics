using {portal.Power.Analytics.PowerBiPortal as pa} from '../db/schema';


@requires: 'authenticated-user'
service PowerBiService @(path: '/powerbi/PowerBiService') {

    type EmbedDetails {
        html : String;
    }

    type AccessStatus {
        statusCode : Integer;
        message    : String;
    }

    @(requires: ['Admin'])
    entity PowerBi as projection on pa.PowerBi {
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
    action checkReportAccess(url : String) returns AccessStatus;

    @(requires: ['Admin'])
    entity Users as projection on pa.Users {
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
    entity SecurityFilters as projection on pa.SecurityFilters {
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
    entity ReportsToSecurityFilters as projection on pa.ReportsToSecurityFilters {
        ID         as ID,
        report     as report,
        filter     as filter,
        createdAt  as createdAt,
        createdBy  as createdBy,
        modifiedAt as modifiedAt,
        modifiedBy as modifiedBy
    };

    entity ReportsExposed as projection on pa.ReportsExposed {
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
    } actions {
        function getEmbedDetails(deviceType : String)      returns EmbedDetails;
        action   getEmbedDetailsForUser(userID : UUID)     returns EmbedDetails;
        action   getFilterFieldsForReport(reportID : UUID) returns array of {
            table                  : String;
            column                 : String;
            requireSingleSelection : Boolean;
        };
        action   embedReportWithFiltersAuto(reportExposedId : UUID,
                                            filters : array of {
            table                  : String;
            column                 : String;
            values                 : array of String;
        })                                                 returns EmbedDetails;
    };

    @cds.persistence.skip
    entity LiveWorkspaces @cds.odata.virtual {
        key id       : UUID;
            name     : String;
            configId : UUID;
    }

    @(requires: ['Admin'])
    @cds.persistence.skip
    entity LiveReports {
        key id          : UUID;
            name        : String;
            embedUrl    : String;
            webUrl      : String;
            datasetId   : UUID;
            configId    : UUID;
            workspaceId : UUID;
    }

}

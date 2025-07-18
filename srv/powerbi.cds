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
  entity PowerBi                  as projection on pa.PowerBi;

  @(requires: ['Admin'])
  action checkReportAccess(url : String) returns AccessStatus;

  @(requires: ['Admin'])
  entity Users                    as projection on pa.Users;

  @(requires: ['Admin'])
  entity SecurityFilters          as projection on pa.SecurityFilters;

  @(requires: ['Admin'])
  entity ReportsToSecurityFilters as projection on pa.ReportsToSecurityFilters;

  entity ReportsExposed           as projection on pa.ReportsExposed
    actions {
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


  // Define entities as unbound (no projection)
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

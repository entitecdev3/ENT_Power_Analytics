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

  entity PowerBi                  as projection on pa.PowerBi;
  action checkReportAccess(url : String) returns AccessStatus;
  entity Users                    as projection on pa.Users;
  entity SecurityFilters          as projection on pa.SecurityFilters;
  entity ReportsToSecurityFilters as projection on pa.ReportsToSecurityFilters;

  entity ReportsExposed           as projection on pa.ReportsExposed
    actions {
      function getEmbedDetails()                         returns EmbedDetails;
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

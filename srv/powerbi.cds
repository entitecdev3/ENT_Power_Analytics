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

  entity PowerBi        as projection on pa.PowerBi;
  action checkReportAccess(url : String) returns AccessStatus;

  entity ReportsExposed as projection on pa.ReportsExposed
    actions {
      function getEmbedDetails() returns EmbedDetails;
    };

  // Define entities as unbound (no projection)
  @cds.persistence.skip
  entity LiveWorkspaces @cds.odata.virtual{
    key id   : UUID;
        name : String;
        configId     : UUID; 
  }

  @cds.persistence.skip
  entity LiveReports {
    key id        : UUID;
        name      : String;
        embedUrl  : String;
        webUrl    : String;
        datasetId : UUID;
        configId     : UUID; 
        workspaceId  : UUID;
  }


}

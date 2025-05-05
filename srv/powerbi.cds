using {portal.Power.Analytics.PowerBiPortal as pa} from '../db/schema';

@requires: 'authenticated-user'
service PowerBiService @(path: '/powerbi/PowerBiService') {
  type EmbedDetails {
    html : String;
  }

  type AccessStatus {
    statusCode: Integer;
    message: String;
  }

  entity PowerBi        as projection on pa.PowerBi;

  action checkReportAccess(url: String) returns AccessStatus;

  entity ReportsExposed as projection on pa.ReportsExposed
    actions {
      function getEmbedDetails() returns EmbedDetails;
    };

  


}

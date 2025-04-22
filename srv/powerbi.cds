using {portal.Power.Analytics.PowerBiPortal as pa} from '../db/schema';

@requires: 'authenticated-user'
service PowerBiService @(path: '/powerbi/PowerBiService') {
  type EmbedDetails {
    html : String;
  }

  entity PowerBi        as projection on pa.PowerBi;

  entity ReportsExposed as projection on pa.ReportsExposed
    actions {
      action getEmbedDetails() returns EmbedDetails;
    };


}

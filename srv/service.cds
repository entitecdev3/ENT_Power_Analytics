// services

using portal.Power.Analytics.PowerBiPortal from '../db/schema';
using auth from './auth';

@requires: 'authenticated-user'
service MyService @(path: 'MyService') {
    entity Roles @cds.redirection.target          as projection on PowerBiPortal.Roles;
    entity Companies                              as projection on PowerBiPortal.Companies;
    entity MyReports                              as projection on PowerBiPortal.ReportsExposed;


    @(requires: ['Admin'])
    entity Users                                  as projection on PowerBiPortal.Users;

    @(requires: ['Admin'])
    entity AssignableRoles                        as
        projection on PowerBiPortal.Roles {
            ID,
            name
        }
        where
            name != 'Admin';

    @(requires: ['Admin'])
    entity PowerBi                                as projection on PowerBiPortal.PowerBi;
    @(requires: ['Admin'])
    entity Identity                               as projection on PowerBiPortal.Identity;
    @(requires: ['Admin'])
    entity SecurityFilters                        as projection on PowerBiPortal.SecurityFilters;
    @(requires: ['Admin'])
    entity Configuration                          as projection on PowerBiPortal.Configuration;
    @(requires: ['Admin'])
    entity ReportsToSecurityFilters               as projection on PowerBiPortal.ReportsToSecurityFilters;
    @(requires: ['Admin'])
    entity ReportsToRoles                         as projection on PowerBiPortal.ReportsToRoles;
    @(requires: ['Admin'])
    entity ReportsExposed @cds.redirection.target as projection on PowerBiPortal.ReportsExposed;
    function getCustomAttrbute() returns auth.CustomAttributes;
    function getUserInfo()       returns auth.UserInfo;

}

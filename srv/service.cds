// services

using portal.Power.Analytics.PowerBiPortal from '../db/schema';
using auth from './auth';
// using auth.AuthService as Auth;

@requires: 'authenticated-user'
service MyService @(path: 'MyService') {
    entity Roles                    as projection on PowerBiPortal.Roles;
    entity Companies                as projection on PowerBiPortal.Companies;
    entity ReportsExposed           as projection on PowerBiPortal.ReportsExposed;

    @(requires: ['Admin'])
    entity Users                    as projection on PowerBiPortal.Users;

    entity PowerBi                  as projection on PowerBiPortal.PowerBi;
    entity Identity                 as projection on PowerBiPortal.Identity;
    entity SecurityFilters          as projection on PowerBiPortal.SecurityFilters;
    entity DisplaySettings          as projection on PowerBiPortal.DisplaySettings;
    entity Configuration            as projection on PowerBiPortal.Configuration;
    entity ReportsToSecurityFilters as projection on PowerBiPortal.ReportsToSecurityFilters;
    function getCustomAttrbute() returns auth.CustomAttributes;
    function getUserInfo()       returns auth.UserInfo;

}

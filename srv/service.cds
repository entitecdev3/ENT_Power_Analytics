// services

using portal.Power.Analytics.PowerBIPortal from '../db/schema';

service MyService @(path: 'MyService'){
    entity Roles as projection on PowerBIPortal.Role;
    entity Companies as projection on PowerBIPortal.Company;
    entity Users as projection on PowerBIPortal.Users;
    entity PowerBI as projection on PowerBIPortal.PowerBI;
    entity Identities as projection on PowerBIPortal.Identity;
    entity ReportsExposed as projection on PowerBIPortal.ReportsExposed;
    entity SecurityFiltersType as projection on PowerBIPortal.SecurityFiltersType;
    entity SecurityFilters as projection on PowerBIPortal.SecurityFilters;
    entity DisplaySettings as projection on PowerBIPortal.DisplaySettings;
    entity Configurations as projection on PowerBIPortal.Configuration;
}
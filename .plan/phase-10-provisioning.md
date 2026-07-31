# Phase 10 — Fleet Provisioning & PXE Boot

## Goal
Automate bare-metal Windows Server deployment via PXE boot with unattended installation, post-install configuration, and automatic domain join.

## Features

### 10.1 PXE Boot Server Integration

- Configure TFTP/WDS server settings in NEXUS
- Upload boot images (WIM/ISO)
- Manage boot menu entries
- Monitor PXE boot requests in real-time

### 10.2 Answer File Generator

- Template-based `autounattend.xml` generation
- Variables: hostname, IP, domain, admin password, product key
- OS variant selection (Standard, Datacenter, Core)
- Post-install script injection (domain join, WinRM enable, NEXUS agent install)

### 10.3 Golden Image Management

- Upload/register golden ISO images
- Version tracking
- Associate images with server groups
- Sysprep state validation

### 10.4 Provisioning Workflow

1. Admin creates a "Provision Request": target MAC, hostname, image, network config
2. NEXUS configures WDS reservation for that MAC
3. Server PXE boots → installs from golden image
4. Post-install script enables WinRM + joins domain
5. AD sync picks up new server → appears in NEXUS automatically
6. Post-provision runbook runs (install roles, configure services)

### 10.5 Provisioning Dashboard

**Route: `/provisioning`**
- Active provisioning jobs with progress
- Completed deployments history
- Image library
- Template editor for unattend files

## Validation Checklist

- [ ] Answer file generates valid XML
- [ ] PXE settings configure correctly
- [ ] Provisioning workflow completes end-to-end (in test env)
- [ ] New server appears in NEXUS after provisioning
- [ ] Post-provision runbook executes successfully

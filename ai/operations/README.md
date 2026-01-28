# Operations Documentation Index

Planning, tracking, and operational guidelines for the Nexora Nuxt 4 E-commerce project.

---

## 📁 Operations Files

### [not-implemented.md](not-implemented.md)
**Frontend Integration Roadmap**

Complete tracking of backend features that need frontend implementation.

**Contents:**
- Quick status overview for all features
- Implementation priority matrix
- Detailed frontend requirements per feature
- Files to create/update
- Relevant backend endpoints
- API reference guide
- Implementation guidelines

**Status:** Active - Updated 2026-01-19

**Use for:**
- Planning frontend development
- Understanding what needs to be built
- Prioritizing implementation tasks
- API integration reference

---

### [frontend-todo.md](frontend-todo.md)
**Quick Actionable Checklist**

Concise, developer-friendly checklist extracted from not-implemented.md.

**Contents:**
- Quick priority list (Critical, High, Medium, Low)
- Exact file paths to create/update
- API endpoints to integrate
- Estimated effort per task
- Checkboxes for tracking progress

**Status:** Active - Updated 2026-01-19

**Use for:**
- Daily development planning
- Quick task reference
- Progress tracking
- Sprint planning

---

### [backend-endpoints-delta.md](backend-endpoints-delta.md)
**Backend Endpoints Delta**

Compares backend API spec (`endpoints/` YAML) with frontend docs and code. Lists what to update, add, or implement.

**Contents:**
- New backend endpoints (docs + implementation status)
- Mismatches between backend and frontend (verify / update)
- Deprecated or missing endpoints to remove/N/A
- Implementation checklist (docs + code)

**Use for:** Aligning frontend with backend API changes; planning doc and code updates.

---

### [ai-rules.md](ai-rules.md)
**Operational Rules for AI Agents**

Operational guidelines for AI output format and behavior.

**Contents:**
- Output format rules
- File path conventions
- Correction guidelines

**Status:** Active

**Use for:**
- Understanding AI output expectations
- Code generation standards
- File organization rules

---

## 🗑️ Removed Files

The following files were removed during the 2026-01-19 reorganization as they were outdated:

- `api-implementation-plan.md` - Outdated after API updates
- `implementation-status.md` - Superseded by not-implemented.md
- `i18n-implementation-plan.md` - No longer relevant

---

## 🎯 Quick Start Guide

### For New Features

1. **Check Status**
   - Open [not-implemented.md](not-implemented.md)
   - Find the feature in the Quick Status Overview
   - Check priority level

2. **Review Requirements**
   - Read the feature section for detailed requirements
   - Note files to create/update
   - Review relevant backend endpoints

3. **Consult API Documentation**
   - Navigate to corresponding `../api/*.md` file
   - Study endpoint specifications
   - Check request/response formats

4. **Implement**
   - Follow patterns from existing similar features
   - Use stores for business logic
   - Respect SSR/CSR rules
   - Include proper error handling

5. **Update Tracking**
   - Check off items in [frontend-todo.md](frontend-todo.md)
   - Update [not-implemented.md](not-implemented.md) status if needed

---

## 📊 Implementation Status Summary

### Backend Status
✅ **All backend API endpoints are AVAILABLE**
- 90+ endpoints documented and ready
- Full CRUD operations for all features
- Webhook support for integrations
- Comprehensive error handling

### Frontend Status
❌ **Multiple features need frontend implementation**

**Priority Breakdown:**
- 🔴 **Critical (2)**: OAuth Login, Loyalty Points
- 🟡 **High (3)**: Notifications, Reviews, Warehouse Selection
- 🟢 **Medium (2)**: Identity Extensions, Comments
- ⚪ **Low (2)**: Leads, Customer Support

See [not-implemented.md](not-implemented.md) for detailed breakdown.

---

## 🎯 Priority Matrix

| Priority | Features | Estimated Effort |
|----------|----------|------------------|
| Critical | OAuth Login, Loyalty Points | 2-3 days |
| High | Notifications, Reviews, Warehouse Selection | 3-4 days |
| Medium | Identity Extensions, Comments | 1-2 days |
| Low | Leads, Customer Support | 1-2 days |

**Total Estimated:** 7-11 days of focused development

---

## 📋 Workflow

### Planning Phase
1. Review [not-implemented.md](not-implemented.md) for feature requirements
2. Check [frontend-todo.md](frontend-todo.md) for quick tasks
3. Consult API documentation for endpoints
4. Review stores documentation for state management patterns

### Development Phase
1. Create/update files as specified
2. Implement store actions
3. Build UI components
4. Test API integration
5. Handle edge cases and errors

### Completion Phase
1. Update [frontend-todo.md](frontend-todo.md) checkboxes
2. Test feature thoroughly
3. Document any deviations or changes
4. Update [not-implemented.md](not-implemented.md) if status changes

---

## ⚠️ Important Notes

### Backend vs Frontend Tracking
- **Backend**: All features are implemented and documented
- **Frontend**: Many features still need implementation
- **Gap**: This operations folder tracks the frontend implementation gap

### Documentation Updates
When implementing features:
- ✅ Check off items in frontend-todo.md
- ✅ Update not-implemented.md status if feature becomes partially/fully implemented
- ✅ Note any API changes or deviations discovered during implementation

### Planning vs Execution
- **not-implemented.md**: Comprehensive planning document (read before starting)
- **frontend-todo.md**: Quick execution checklist (use during development)
- **ai-rules.md**: Standards and conventions (follow always)

---

## 🔍 Finding Information

**"What needs to be built?"**
→ Check Quick Status Overview in [not-implemented.md](not-implemented.md)

**"What should I work on next?"**
→ Check Priority List in [frontend-todo.md](frontend-todo.md)

**"How do I implement feature X?"**
→ Read feature section in [not-implemented.md](not-implemented.md), then consult `../api/*.md`

**"What files do I need to create?"**
→ Each feature section lists exact file paths

**"What API endpoints do I use?"**
→ Each feature section lists relevant endpoints with links to API docs

**"What backend endpoints changed or need frontend work?"**
→ Check [backend-endpoints-delta.md](backend-endpoints-delta.md)

---

## 📖 Related Documentation

- **[../api/README.md](../api/README.md)** - API endpoints for integration
- **[../stores/README.md](../stores/README.md)** - Store patterns to follow
- **[../constitution/](../constitution/)** - Rules that must be followed
- **[../README.md](../README.md)** - Main navigation hub

---

## 🆕 Recent Updates (2026-01-19)

- ✅ Cleaned up outdated planning files
- ✅ Updated not-implemented.md with latest backend status
- ✅ Created frontend-todo.md for quick reference
- ✅ Verified all backend endpoints are available
- ✅ Prioritized frontend implementation tasks

---

**Navigate back:** [../README.md](../README.md)

import { Fragment } from 'react'
import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import { PDF_COLORS, PDF_PAGE_PADDING } from './pdfTheme.js'
import PdfHeader from './PdfHeader.jsx'

const styles = StyleSheet.create({
  page: {
    padding: PDF_PAGE_PADDING,
    backgroundColor: PDF_COLORS.page,
    fontFamily: 'Helvetica',
    fontSize: 10.5,
    color: PDF_COLORS.text,
  },
  // No wrapping View around each section's title+grid: react-pdf's
  // paginator mis-measures the *second* such sibling wrapper and pushes its
  // entire content to the next page even when the current page still has
  // plenty of room. Spacing between sections is done with marginTop on the
  // title instead, so titles/grids stay flat siblings that paginate per-card.
  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: PDF_COLORS.text,
    marginTop: 22,
    marginBottom: 12,
    paddingBottom: 6,
    borderBottom: `2px solid ${PDF_COLORS.accent}`,
  },
  firstSectionTitle: {
    marginTop: 0,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  plan: {
    width: '48%',
    backgroundColor: PDF_COLORS.surface,
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
  },
  planTitle: {
    fontSize: 9,
    fontWeight: 700,
    color: PDF_COLORS.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  imageBox: {
    width: '100%',
    height: 110,
    borderRadius: 4,
    backgroundColor: PDF_COLORS.surfaceAlt,
    border: `1px solid ${PDF_COLORS.border}`,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: 110,
    borderRadius: 4,
    objectFit: 'cover',
  },
  noImageText: {
    fontSize: 8.5,
    color: PDF_COLORS.textFaint,
  },
  fieldLabel: {
    fontSize: 7.5,
    fontWeight: 700,
    color: PDF_COLORS.textFaint,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  fieldValue: {
    fontSize: 9.5,
    color: PDF_COLORS.textDim,
    lineHeight: 1.4,
    marginBottom: 6,
  },
  fieldEmpty: {
    fontSize: 9,
    color: PDF_COLORS.textFaint,
    fontStyle: 'italic',
    marginBottom: 6,
  },
  pageNumber: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 8,
    color: PDF_COLORS.textFaint,
  },
})

function PlanBlock({ plan, index }) {
  return (
    // wrap={false}: treat the whole card as an atomic block so react-pdf
    // moves it wholly to the next page instead of cutting it between an
    // image and its text fields.
    <View style={styles.plan} wrap={false}>
      <Text style={styles.planTitle}>Plan {index + 1}</Text>
      <Text style={styles.fieldLabel}>Voix off</Text>
      {plan.voiceover ? (
        <Text style={styles.fieldValue}>{plan.voiceover}</Text>
      ) : (
        <Text style={styles.fieldEmpty}>—</Text>
      )}
      {plan.image ? (
        <Image src={plan.image} style={styles.image} />
      ) : (
        <View style={styles.imageBox}>
          <Text style={styles.noImageText}>Pas d'image</Text>
        </View>
      )}
      <Text style={styles.fieldLabel}>Description</Text>
      {plan.description ? (
        <Text style={styles.fieldValue}>{plan.description}</Text>
      ) : (
        <Text style={styles.fieldEmpty}>—</Text>
      )}
    </View>
  )
}

export default function StoryboardPdf({ projectName, storyboard }) {
  return (
    <Document title={`${projectName} — Storyboard`}>
      <Page size="A4" style={styles.page}>
        <PdfHeader projectName={projectName} docTitle="Storyboard" />

        {storyboard.sections.map((section, sIdx) => {
          const [firstPlan, ...restPlans] = section.plans
          return (
            <Fragment key={section.id}>
              {/* wrap={false}: keeps the section title glued to at least its
                  first plan card so the title never ends up orphaned at the
                  bottom of a page with all its plans pushed to the next one. */}
              <View wrap={false}>
                <Text style={[styles.sectionTitle, sIdx === 0 && styles.firstSectionTitle]}>
                  {section.title}
                </Text>
                {firstPlan && (
                  <View style={styles.grid}>
                    <PlanBlock plan={firstPlan} index={0} />
                  </View>
                )}
              </View>
              {restPlans.length > 0 && (
                <View style={styles.grid}>
                  {restPlans.map((plan, i) => (
                    <PlanBlock key={plan.id} plan={plan} index={i + 1} />
                  ))}
                </View>
              )}
            </Fragment>
          )
        })}

        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
        />
      </Page>
    </Document>
  )
}

import { useState } from "react";
import {
  Box,
  Stack,
  Typography,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";

import useDocumentTitle from "../../hooks/useDocumentTitle";
import CardBox from "../../components/common/Card";
import { POLICIES_DATA, CATEGORY_ORDER } from "./PoliciesData";

// Policy content itself now lives in `src/data/policiesData.jsx` so the
// Ticket Details page can reuse the exact same rules per ticket type.

export default function Policy() {
  useDocumentTitle("قوانین و مقررات | سیستم رزرو بلیط");

  const [activeCategory, setActiveCategory] = useState("general");

  const sections = POLICIES_DATA[activeCategory].sections;

  return (
    <Box dir="rtl">
      {/* Hero */}
      <Box
        sx={{
          background:
            "linear-gradient(135deg, #0653C4 0%, #2A7BFF 60%, #5B8CFF 100%)",
          py: { xs: 5, md: 7 },
          px: 2,
        }}
      >
        <Box sx={{ maxWidth: 720, mx: "auto", textAlign: "center" }}>
          <Typography
            variant="h4"
            fontWeight={700}
            sx={{ color: "#fff", mb: 1 }}
          >
            قوانین و مقررات
          </Typography>
          <Typography sx={{ color: "rgba(255,255,255,.85)" }}>
            لطفا پیش از رزرو، قوانین مربوط به بخش مورد نظر خود را مطالعه
            کنید
          </Typography>
        </Box>
      </Box>

      <Box sx={{ maxWidth: 820, mx: "auto", px: { xs: 2, md: 3 }, py: 5 }}>
        {/* Category tabs */}
        <Tabs
          value={activeCategory}
          onChange={(_, value) => setActiveCategory(value)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            mb: 3,
            borderBottom: "1px solid #E2E8F0",
            "& .MuiTab-root": { fontWeight: 600, minHeight: 56 },
          }}
        >
          {CATEGORY_ORDER.map((key) => (
            <Tab
              key={key}
              value={key}
              icon={POLICIES_DATA[key].icon}
              iconPosition="start"
              label={POLICIES_DATA[key].label}
            />
          ))}
        </Tabs>

        <Stack spacing={1.5}>
          {sections.map((section, sIndex) => (
            <Accordion key={sIndex} disableGutters defaultExpanded={sIndex === 0}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography fontWeight={700}>{section.title}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={1.5}>
                  {section.clauses.map((clause, cIndex) => (
                    <Stack
                      key={cIndex}
                      direction="row"
                      spacing={1}
                      alignItems="flex-start"
                    >
                      <Typography
                        fontWeight={700}
                        color="primary.main"
                        sx={{ minWidth: 20 }}
                      >
                        {cIndex + 1}.
                      </Typography>
                      <Typography color="text.secondary">
                        {clause}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </AccordionDetails>
            </Accordion>
          ))}
        </Stack>

        {/* Support box */}
        <Box mt={5}>
          <CardBox>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              alignItems={{ xs: "flex-start", sm: "center" }}
              justifyContent="space-between"
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <SupportAgentIcon color="primary" fontSize="large" />
                <Box>
                  <Typography fontWeight={700}>
                    سوالی درباره قوانین دارید؟
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    پشتیبانی ما آماده پاسخگویی به شماست.
                  </Typography>
                </Box>
              </Stack>

              <Stack
                direction="row"
                spacing={0.5}
                alignItems="center"
                component="a"
                href="https://mail.google.com/mail/?view=cm&fs=1&to=tickisupport@gmail.com"
                target="_blank"
                rel="noopener noreferrer"
                sx={{ color: "primary.main", textDecoration: "none" }}
              >
                <EmailOutlinedIcon fontSize="small" />
                <Typography fontWeight={600}>
                  tickisupport@gmail.com
                </Typography>
              </Stack>
            </Stack>
          </CardBox>
        </Box>
      </Box>
    </Box>
  );
}

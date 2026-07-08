import {
  Divider,
  IconButton,
  Link,
  Modal,
  Button,
  Box,
  Typography,
  Fade,
  Backdrop,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import GitHubIcon from "@mui/icons-material/GitHub";
import EmailIcon from "@mui/icons-material/Email";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import CloseIcon from "@mui/icons-material/Close";
import { useState } from "react";

export default function Footer() {
  const [open, setOpen] = useState(false);
  const theme = useTheme();

  const emails = [
    "tickisupport@gmail.com",
    "mobintorabi592@gmail.com",
    "aylinamjad@gmail.com",
  ];

  return (
    <footer
      className="mt-20 border-t"
      style={{
        backgroundColor: theme.palette.background.paper,
        borderColor: theme.palette.grey[200],
      }}
    >
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-col md:flex-row items-start justify-between gap-10">
          <div style={{ marginRight: "70px" ,fontSize: "20px"}}>
            <Typography sx={{ mt: 6, mb: 2 ,fontSize:20}} fontWeight={600}>
              خدمات مشتریان
            </Typography>

            <div className="flex flex-col gap-2">
              <Link href="#" underline="hover" color="text.secondary">
                پشتیبانی
              </Link>

              <Link href="#" underline="hover" color="text.secondary">
                پرسش و پاسخ
              </Link>

              <Link href="#" underline="hover" color="text.secondary">
                قوانین و مقررات
              </Link>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <img src="/logo.png" alt="Ticki" className="h-12 w-60" />

            <div className="mt-2">
              <IconButton
                component="a"
                href="https://github.com/mobin-torabi/Booking-Ticket-System"
                target="_blank"
                rel="noopener noreferrer"
              >
                <GitHubIcon sx={{ fontSize: 40 }} />
              </IconButton>

              <IconButton onClick={() => setOpen(true)}>
                <EmailIcon sx={{ fontSize: 40 }} />
              </IconButton>
            </div>

            <Modal
              open={open}
              onClose={() => setOpen(false)}
              closeAfterTransition
              slots={{ backdrop: Backdrop }}
              slotProps={{
                backdrop: {
                  timeout: 300,
                },
              }}
            >
              <Fade in={open}>
                <Box
                  sx={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: 430,
                    maxWidth: "90vw",
                    bgcolor: "background.paper",
                    borderRadius: 4,
                    boxShadow: 24,
                    p: 4,
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <IconButton
                    onClick={() => setOpen(false)}
                    sx={{
                      position: "absolute",
                      top: 10,
                      right: 10,
                    }}
                  >
                    <CloseIcon  />
                  </IconButton>

                  <Typography
                   sx={{mt:3}}
                    variant="h5"
                    fontWeight={700}
                    textAlign="center"
                 
                  >
                    تماس با ما
                  </Typography>


                  {emails.map((email) => (
                    <Box
                      key={email}
                      component="a"
                      href={`https://mail.google.com/mail/?view=cm&fs=1&to=${email}`}
                      target="_balnk"
                      rel="noopener noreferrer"
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        p: 2,
                        mb: 2,
                        borderRadius: 3,
                        textDecoration: "none",
                        color: "text.primary",
                        transition: "all .30s ease",
                        "&:hover": {
                          bgcolor: "grey.100",
                          transform: "translateY(-1px)",
                          boxShadow: 1,
                        },
                      }}
                    >
                      <EmailOutlinedIcon color="primary" />

                      <Typography>{email}</Typography>
                    </Box>
                  ))}

                  <Box display="flex" justifyContent="center" mt={2}>
                    <Button variant="contained" onClick={() => setOpen(false)}>
                      بستن
                    </Button>
                  </Box>
                </Box>
              </Fade>
            </Modal>
          </div>
        </div>

        <Divider sx={{ my: 4 }} />

        <div className="flex justify-center">
          <Typography textAlign="center" color="text.secondary">
            ©2026 استفاده از مطالب این وب سایت فقط برای مقاصد غیر تجاری و با ذکر
            منبع بلامانع است. کلیه حقوق این سایت متعلق به تیکی می‌باشد.
          </Typography>
        </div>
      </div>
    </footer>
  );
}
